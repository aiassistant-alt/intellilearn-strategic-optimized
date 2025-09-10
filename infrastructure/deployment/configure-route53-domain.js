const { Route53Client, ChangeResourceRecordSetsCommand, ListHostedZonesByNameCommand } = require('@aws-sdk/client-route-53');
const { ACMClient, RequestCertificateCommand, DescribeCertificateCommand } = require('@aws-sdk/client-acm');
const { CloudFrontClient, GetDistributionCommand, UpdateDistributionCommand } = require('@aws-sdk/client-cloudfront');
require('dotenv').config({ path: '.env.aws' });

const route53Client = new Route53Client({
  region: 'us-east-1',
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY
  }
});

const acmClient = new ACMClient({
  region: 'us-east-1',
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY
  }
});

const cloudFrontClient = new CloudFrontClient({
  region: 'us-east-1',
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY
  }
});

const DOMAIN = 'telmoai.mx';
const CLOUDFRONT_DISTRIBUTION_ID = 'E11HT8YLQY6FDL';
const CLOUDFRONT_DOMAIN = 'd2j7zvp3tz528c.cloudfront.net';

async function main() {
  try {
    console.log('🌐 Configurando dominio telmoai.mx en Route 53...\n');

    // 1. Obtener la Hosted Zone ID
    console.log('1. Buscando Hosted Zone para telmoai.mx...');
    const hostedZones = await route53Client.send(new ListHostedZonesByNameCommand({
      DNSName: DOMAIN
    }));

    const hostedZone = hostedZones.HostedZones.find(zone => zone.Name === `${DOMAIN}.`);
    
    if (!hostedZone) {
      throw new Error('No se encontró la Hosted Zone para telmoai.mx');
    }

    const hostedZoneId = hostedZone.Id.split('/').pop();
    console.log(`   ✅ Hosted Zone ID: ${hostedZoneId}`);

    // 2. Crear registros A y AAAA para apex y www
    console.log('\n2. Creando registros DNS...');
    
    const changes = [
      {
        Action: 'UPSERT',
        ResourceRecordSet: {
          Name: DOMAIN,
          Type: 'A',
          AliasTarget: {
            HostedZoneId: 'Z2FDTNDATAQYW2', // CloudFront Hosted Zone ID
            DNSName: CLOUDFRONT_DOMAIN,
            EvaluateTargetHealth: false
          }
        }
      },
      {
        Action: 'UPSERT',
        ResourceRecordSet: {
          Name: `www.${DOMAIN}`,
          Type: 'A',
          AliasTarget: {
            HostedZoneId: 'Z2FDTNDATAQYW2',
            DNSName: CLOUDFRONT_DOMAIN,
            EvaluateTargetHealth: false
          }
        }
      }
    ];

    const changeCommand = new ChangeResourceRecordSetsCommand({
      HostedZoneId: hostedZoneId,
      ChangeBatch: {
        Changes: changes,
        Comment: 'Configurando telmoai.mx para apuntar a CloudFront'
      }
    });

    const result = await route53Client.send(changeCommand);
    console.log(`   ✅ Registros DNS creados exitosamente`);
    console.log(`   Change ID: ${result.ChangeInfo.Id}`);

    // 3. Solicitar certificado SSL
    console.log('\n3. Solicitando certificado SSL en ACM...');
    
    const certRequest = await acmClient.send(new RequestCertificateCommand({
      DomainName: DOMAIN,
      SubjectAlternativeNames: [DOMAIN, `www.${DOMAIN}`, `*.${DOMAIN}`],
      ValidationMethod: 'DNS',
      Tags: [
        { Key: 'Name', Value: 'telmoai-mx-cert' },
        { Key: 'Project', Value: 'IntelliLearn' }
      ]
    }));

    console.log(`   ✅ Certificado solicitado: ${certRequest.CertificateArn}`);

    // 4. Instrucciones finales
    console.log('\n📋 Pasos siguientes:');
    console.log('\n1. Ve a AWS Certificate Manager:');
    console.log('   https://console.aws.amazon.com/acm/home?region=us-east-1');
    console.log('   - El certificado estará pendiente de validación');
    console.log('   - Haz clic en el certificado y luego en "Create records in Route 53"');
    console.log('   - Espera a que el estado cambie a "Issued" (5-10 minutos)');
    
    console.log('\n2. Actualiza CloudFront con el certificado:');
    console.log('   - Ve a CloudFront: https://console.aws.amazon.com/cloudfront/');
    console.log('   - Selecciona tu distribución');
    console.log('   - En "General" → "Settings" → Edit');
    console.log('   - En "Alternate domain name (CNAME)" agrega:');
    console.log('     • telmoai.mx');
    console.log('     • www.telmoai.mx');
    console.log('   - En "Custom SSL certificate" selecciona el certificado recién creado');
    console.log('   - Guarda los cambios');

    console.log('\n3. Verifica la propagación DNS (30 min - 4 horas):');
    console.log('   dig A telmoai.mx');
    console.log('   nslookup telmoai.mx');

    console.log('\n✅ Una vez completado, podrás acceder a:');
    console.log('   https://telmoai.mx');
    console.log('   https://www.telmoai.mx');

  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
}

main();