import { DynamoDBClient } from '@aws-sdk/client-dynamodb'
import { DynamoDBDocumentClient, ScanCommand } from '@aws-sdk/lib-dynamodb'
import { AWS_CONFIG } from '../config'

// Configuración AWS
const awsConfig = {
  region: AWS_CONFIG.region
}

const dynamoClient = new DynamoDBClient(awsConfig)
const docClient = DynamoDBDocumentClient.from(dynamoClient)

/**
 * Genera un número de curso único de 9 dígitos
 * Formato: 000000000, 000000001, 000000002, etc.
 */
export class CourseNumberGenerator {
  private static readonly COURSE_NUMBER_LENGTH = 9
  private static readonly COURSES_TABLE = 'intellilearn-courses'

  /**
   * Genera el siguiente número de curso disponible
   */
  static async generateNextCourseNumber(): Promise<string> {
    try {
      // Obtener todos los números de curso existentes
      const existingNumbers = await this.getExistingCourseNumbers()
      
      // Encontrar el siguiente número disponible
      const nextNumber = this.findNextAvailableNumber(existingNumbers)
      
      return this.formatCourseNumber(nextNumber)
      
    } catch (error) {
      console.error('Error generating course number:', error)
      // Si hay error, generar uno basado en timestamp como fallback
      return this.generateFallbackNumber()
    }
  }

  /**
   * Obtiene todos los números de curso existentes
   */
  private static async getExistingCourseNumbers(): Promise<number[]> {
    try {
      const command = new ScanCommand({
        TableName: this.COURSES_TABLE,
        ProjectionExpression: 'id'
      })
      
      const result = await docClient.send(command)
      
      return result.Items?.map(item => {
        const courseNumber = item.id
        // Convertir a número si es un string numérico válido
        const num = parseInt(courseNumber, 10)
        return isNaN(num) ? 0 : num
      }).filter(num => num >= 0) || []
      
    } catch (error) {
      console.error('Error fetching existing course numbers:', error)
      return []
    }
  }

  /**
   * Encuentra el siguiente número disponible en la secuencia
   */
  private static findNextAvailableNumber(existingNumbers: number[]): number {
    // Ordenar los números existentes
    const sortedNumbers = existingNumbers.sort((a, b) => a - b)
    
    // Si no hay números, empezar desde 0
    if (sortedNumbers.length === 0) {
      return 0
    }
    
    // Buscar el primer gap en la secuencia
    for (let i = 0; i < sortedNumbers.length; i++) {
      if (sortedNumbers[i] !== i) {
        return i
      }
    }
    
    // Si no hay gaps, usar el siguiente número en la secuencia
    return sortedNumbers.length
  }

  /**
   * Formatea el número a 9 dígitos con ceros a la izquierda
   */
  private static formatCourseNumber(number: number): string {
    return number.toString().padStart(this.COURSE_NUMBER_LENGTH, '0')
  }

  /**
   * Genera un número de fallback basado en timestamp
   */
  private static generateFallbackNumber(): string {
    const timestamp = Date.now()
    const randomSuffix = Math.floor(Math.random() * 1000)
    const fallbackNumber = parseInt(timestamp.toString().slice(-6) + randomSuffix.toString().padStart(3, '0'))
    
    return this.formatCourseNumber(fallbackNumber % 1000000000) // Asegurar que sea de 9 dígitos
  }

  /**
   * Valida si un número de curso tiene el formato correcto
   */
  static isValidCourseNumber(courseNumber: string): boolean {
    return /^\d{9}$/.test(courseNumber)
  }

  /**
   * Convierte un courseNumber a su representación numérica
   */
  static courseNumberToInt(courseNumber: string): number {
    return parseInt(courseNumber, 10)
  }

  /**
   * Genera múltiples números de curso (para testing)
   */
  static async generateMultipleCourseNumbers(count: number): Promise<string[]> {
    const numbers: string[] = []
    
    for (let i = 0; i < count; i++) {
      const number = await this.generateNextCourseNumber()
      numbers.push(number)
    }
    
    return numbers
  }
}

// Función de utilidad para usar en otros archivos
export const generateCourseNumber = () => CourseNumberGenerator.generateNextCourseNumber()
export const validateCourseNumber = (courseNumber: string) => CourseNumberGenerator.isValidCourseNumber(courseNumber) 