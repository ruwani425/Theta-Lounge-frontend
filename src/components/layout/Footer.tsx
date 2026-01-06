// src/components/layout/Footer.tsx

import React from "react";
import { Flower, CalendarCheck, Star } from "lucide-react";


const Footer: React.FC = () => {
  return (
    <footer
      className="relative pt-20 pb-0 bg-cover bg-center text-white w-full bg-dark-blue-600"
    >
      {/* Curved top shape */}
      <div
        className="absolute top-0 left-0 right-0 h-10 bg-white"
        style={{
          clipPath: "polygon(0 0, 100% 0, 100% 100%, 0% 100%)",
          transform: "translateY(-40px)",
        }}
      ></div>

      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Top Section: Address, Hours, Logo, CTA */}
        <div className="text-center mb-16">
          <div className="flex justify-center text-sm font-display font-semibold mb-10 text-gray-300 space-x-12">
            <div>
              <p className="uppercase tracking-widest mb-3 font-bold">ADDRESS</p>
              <p className="font-sans">200 Sutter St Suite 602 San</p>
              <p className="font-sans">Francisco, CA 94108</p>
            </div>
            <div>
              <p className="uppercase tracking-widest mb-3 font-bold">OFFICE HOURS</p>
              <p className="font-sans">Mon–Thu: 7:30 AM–7:30 PM</p>
              <p className="font-sans">Friday: 8:00 AM–4:30 PM</p>
            </div>
          </div>

          <div className="flex items-center justify-center space-x-3 text-4xl font-serif font-bold text-white mb-8">
            <Flower className="w-10 h-10 text-white" />
            <span className="tracking-wide">Floating Theraphy</span>
          </div>

          <div className="flex flex-wrap justify-center items-center gap-4">
            <button className="flex items-center px-6 py-3 bg-white text-dark-blue-600 font-display font-bold rounded-full shadow-xl hover:shadow-2xl hover:bg-gray-100 transform hover:scale-105 transition-all duration-300">
              (422) 820 820
            </button>
            <button className="flex items-center px-6 py-3 bg-white text-dark-blue-600 font-display font-bold rounded-full shadow-xl hover:shadow-2xl hover:bg-gray-100 transform hover:scale-105 transition-all duration-300">
              <CalendarCheck className="w-5 h-5 mr-2" />
              Book Appointment
            </button>
          </div>
        </div>

        {/* Bottom Section: Footer Links */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8 border-t border-gray-600 pt-10 text-sm">
          {/* ABOUT */}
          <div className="space-y-4">
            <h4 className="font-display font-bold mb-2 text-light-blue-200 uppercase tracking-wider">
              ABOUT
            </h4>
            <ul className="space-y-2 text-gray-300 font-sans">
              <li className="hover:text-white cursor-pointer transition-colors duration-300">Who we are</li>
              <li className="hover:text-white cursor-pointer transition-colors duration-300">Reviews</li>
              <li className="hover:text-white cursor-pointer transition-colors duration-300">Blog</li>
              <li className="hover:text-white cursor-pointer transition-colors duration-300">Contact us</li>
            </ul>
          </div>
          {/* SERVICES */}
          <div className="space-y-4">
            <h4 className="font-display font-bold mb-2 text-light-blue-200 uppercase tracking-wider">
              SERVICES
            </h4>
            <ul className="space-y-2 text-gray-300 font-sans">
              <li className="hover:text-white cursor-pointer transition-colors duration-300">Chiropractic Care</li>
              <li className="hover:text-white cursor-pointer transition-colors duration-300">Medical Massage</li>
              <li className="hover:text-white cursor-pointer transition-colors duration-300">Chronic Pain</li>
              <li className="hover:text-white cursor-pointer transition-colors duration-300">Posture Correction</li>
              <li className="hover:text-white cursor-pointer transition-colors duration-300">Sport Injuries</li>
            </ul>
          </div>
          {/* CONDITIONS */}
          <div className="space-y-4">
            <h4 className="font-display font-bold mb-2 text-light-blue-200 uppercase tracking-wider">
              CONDITIONS
            </h4>
            <ul className="space-y-2 text-gray-300 font-sans">
              <li className="hover:text-white cursor-pointer transition-colors duration-300">Back pain</li>
              <li className="hover:text-white cursor-pointer transition-colors duration-300">Neck pain</li>
              <li className="hover:text-white cursor-pointer transition-colors duration-300">Headaches/migraines</li>
              <li className="hover:text-white cursor-pointer transition-colors duration-300">Sciatica</li>
              <li className="hover:text-white cursor-pointer transition-colors duration-300">Shoulder Pain</li>
            </ul>
          </div>
          {/* PATIENTS */}
          <div className="space-y-4">
            <h4 className="font-display font-bold mb-2 text-light-blue-200 uppercase tracking-wider">
              PATIENTS
            </h4>
            <ul className="space-y-2 text-gray-300 font-sans">
              <li className="hover:text-white cursor-pointer transition-colors duration-300">Patient Paperwork</li>
              <li className="hover:text-white cursor-pointer transition-colors duration-300">Book an appointment</li>
              <li className="hover:text-white cursor-pointer transition-colors duration-300">FAQ</li>
            </ul>
          </div>
        </div>
      </div>

      {/* Copyright Strip */}
      <div className="mt-8 border-t border-gray-600 pt-4 pb-4 text-center text-xs text-gray-400 font-sans">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex justify-between items-center">
          <span>
            © {new Date().getFullYear()} VamTam. All rights reserved.
          </span>
          <div className="flex space-x-4 items-center">
            <span className="hover:text-white cursor-pointer transition-colors duration-300 font-display">
              Terms of Service
            </span>
            <span className="hover:text-white cursor-pointer transition-colors duration-300 font-display">
              Privacy Policy
            </span>
            {/* Social Icons Placeholder */}
            <Star className="w-4 h-4 hover:text-white cursor-pointer transition-colors duration-300" />
            <Star className="w-4 h-4 hover:text-white cursor-pointer transition-colors duration-300" />
            <Star className="w-4 h-4 hover:text-white cursor-pointer transition-colors duration-300" />
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;