'use client'
import { AiOutlineMail } from 'react-icons/ai';
import { BsTelephone, BsTwitterX } from 'react-icons/bs';
import { SlLocationPin } from 'react-icons/sl';
import { FaFacebook, FaInstagram, FaLinkedin } from 'react-icons/fa';

export const FooterComponet = () => {
    return(
        <footer className="footer bg-gradient-to-r from-[#0D1B40] to-[#2D1F7F] text-white px-6 py-10 text-sm">
        <div className="max-w-7xl mx-auto grid gap-8 md:grid-cols-3">
          {/* Logo y texto */}
          <div>
             <div className="mb-6">
                                        <img
                                            className='brightness-0 invert'
                                            src={'/assets/images/logo-white.svg'}
                                            alt="Logo"
                                            width={219}
                                            height={60}
                                            style={{ maxWidth: '100%', height: 'auto' }}
                                        />
                                    </div>
            <p className=" text-white/90 font-extralight text-[16px] leading-relaxed">
              Transforming education with the power of artificial intelligence. Request a demo and discover how we can help you.
            </p>
          </div>
  
          {/* Enlaces rápidos */}
          <div>
            <h3 className="text-[20px] font-semibold mb-3">Quick Links</h3>
            <ul className="space-y-2 text-white/90 text-[16px]">
              <li><a href="#how-it-works" className="hover:underline">How It Works?</a></li>
              <li><a href="#benefits" className="hover:underline">Benefits</a></li>
              <li><a href="#testimonials" className="hover:underline">Testimonials</a></li>
              <li><a href="#demo" className="hover:underline">Request Demo</a></li>
            </ul>
          </div>
  
          {/* Contacto */}
          <div>
            <h3 className="text-[20px] font-semibold mb-3">Contact Us</h3>
            <ul className="space-y-2 text-white/90 text-[16px]">
              <li className='flex items-center gap-2.5'><AiOutlineMail className='text-[22px]'/> info@cognia.edu</li>
              <li className='flex items-center gap-2.5'><BsTelephone className='text-[22px]'/> +1 (555) 123-4567</li>
              <li className='flex items-center gap-2.5'><SlLocationPin className='text-[22px]'/> New York, USA</li>
            </ul>
          </div>
        </div>
  
        {/* Línea divisoria */}
        <div className="border-t border-white/20 my-6" />
  
        {/* Parte inferior */}
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-center text-white/70 gap-4">
          <div className="flex gap-4 text-[12px]">
            <a href="#" className="hover:underline">Data Processing and Privacy Policy</a>
          </div>
          <p className='text-[12px]'>© 2025 CognIA. All rights reserved.</p>
          <div className='flex gap-4'>
            <a href="" className='text-[24px]'><BsTwitterX/></a>
            <a href="" className='text-[24px]'><FaFacebook/></a>
            <a href="" className='text-[24px]'><FaInstagram/></a>
            <a href="" className='text-[24px]'><FaLinkedin/></a>
          </div>
          <div>
            logo
          </div>
        </div>
      </footer>
    )
}