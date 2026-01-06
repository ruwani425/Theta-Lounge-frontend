import React from "react";
import {
  Award,
  Heart,
  Users,
  Target,
  Sparkles,
  CheckCircle,
  // Quote,
  // Star,
  Shield,
} from "lucide-react";

import { motion } from "framer-motion";
import type { Variants } from "framer-motion"; // Use a separate type-only import

const fadeInUp: Variants = {
  hidden: { opacity: 0, y: 40 },
  visible: { 
    opacity: 1, 
    y: 0, 
    transition: { duration: 0.7, ease: "easeOut" } 
  }
};

const staggerContainer: Variants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.2,
      delayChildren: 0.1
    }
  }
};

const scaleIn: Variants = {
  hidden: { opacity: 0, scale: 0.9 },
  visible: { 
    opacity: 1, 
    scale: 1, 
    transition: { duration: 0.5, ease: "easeOut" } 
  }
};

// --- Values/Benefits Data ---
const coreValues = [
  {
    icon: Heart,
    title: "Patient-Centered Care",
    description:
      "Your health and comfort are our top priorities. We listen, understand, and create personalized treatment plans.",
  },
  {
    icon: Award,
    title: "Expert Professionals",
    description:
      "Our team consists of licensed, certified therapists with years of experience in their specialties.",
  },
  {
    icon: Target,
    title: "Results-Driven",
    description:
      "We focus on lasting outcomes, not quick fixes. Your long-term wellness is our ultimate goal.",
  },
  {
    icon: Shield,
    title: "Safe & Trusted",
    description:
      "All therapists are fully insured and follow the highest standards of professional care and ethics.",
  },
];

// --- Stats Data ---
const stats = [
  { number: "15+", label: "Years Experience" },
  { number: "5000+", label: "Happy Patients" },
  { number: "98%", label: "Success Rate" },
  { number: "4.9", label: "Google Rating" },
];

// --- Team Members ---
const teamMembers = [
  {
    name: "Dr. Sarah Mitchell",
    role: "Lead Chiropractor",
    specialty: "Sports Injury & Rehabilitation",
    image: "/GettyImages-2222455931-683x1024.jpg",
    credentials: "DC, CCSP",
  },
  {
    name: "Dr. Mark Johnson",
    role: "Physical Therapist",
    specialty: "Chronic Pain Management",
    image: "/GettyImages-489204244-801x1024.jpg",
    credentials: "DPT, OCS",
  },
  {
    name: "Emily Rodriguez",
    role: "Massage Therapist",
    specialty: "Deep Tissue & Swedish",
    image: "/GettyImages-200112735-001-801x1024.jpg",
    credentials: "LMT, CMT",
  },
];

// --- Testimonials ---
// const testimonials = [
//   {
//     quote:
//       "After a sports injury, I was worried I'd never regain full mobility. The chiropractic care I received here not only helped me recover faster, but also strengthened areas I hadn't even realized were weak.",
//     author: "Rebecca Lorenna",
//     role: "Marathon Runner",
//     rating: 5,
//   },
//   {
//     quote:
//       "I've struggled with back pain for years, and after just a few sessions here, I feel like a new person. The therapists are incredibly skilled, and I always leave feeling refreshed.",
//     author: "Maya Sanchez",
//     role: "Office Professional",
//     rating: 5,
//   },
//   {
//     quote:
//       "This place is peaceful, clean, and the energy is amazing. I felt relaxed the moment I arrived. Highly recommend to anyone needing real stress relief.",
//     author: "Marcus Leroy",
//     role: "Business Owner",
//     rating: 5,
//   },
// ];
const ValueCard: React.FC<{ icon: React.ElementType; title: string; description: string }> = ({ icon: Icon, title, description }) => (
  <motion.div 
    variants={fadeInUp}
    whileHover={{ y: -10 }}
    className="group bg-white rounded-2xl p-8 shadow-lg hover:shadow-2xl transition-all duration-300 border border-gray-100"
  >
    <div className="w-16 h-16 bg-gradient-to-br from-[#3a7ca5] to-[#1B4965] rounded-2xl flex items-center justify-center mb-6 group-hover:rotate-6 transition-transform duration-300 shadow-lg">
      <Icon className="w-8 h-8 text-white" />
    </div>
    <h3 className="text-xl font-serif font-bold text-gray-900 mb-3">{title}</h3>
    <p className="text-gray-600 leading-relaxed">{description}</p>
  </motion.div>
);

const TeamMemberCard: React.FC<{ member: typeof teamMembers[number] }> = ({ member }) => (
  <motion.div 
    variants={fadeInUp}
    className="group bg-white rounded-2xl overflow-hidden shadow-lg hover:shadow-2xl transition-all duration-300"
  >
    <div className="relative h-80 overflow-hidden">
      <img src={member.image} alt={member.name} className="w-full h-full object-cover transform group-hover:scale-110 transition-transform duration-500" />
      <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent"></div>
      <div className="absolute bottom-4 left-4 text-white">
        <p className="text-sm font-semibold mb-1">{member.credentials}</p>
      </div>
    </div>
    <div className="p-6">
      <h3 className="text-2xl font-serif font-bold text-gray-900 mb-2">{member.name}</h3>
      <p className="text-[#3a7ca5] font-semibold mb-2">{member.role}</p>
      <p className="text-gray-600 text-sm">{member.specialty}</p>
    </div>
  </motion.div>
);

// const TestimonialCard: React.FC<{ testimonial: typeof testimonials[number] }> = ({ testimonial }) => (
//   <motion.div 
//     variants={scaleIn}
//     className="bg-white rounded-2xl p-8 shadow-lg border border-gray-100"
//   >
//     <div className="flex mb-4">
//       {[...Array(testimonial.rating)].map((_, i) => <Star key={i} className="w-5 h-5 text-yellow-400 fill-current" />)}
//     </div>
//     <Quote className="w-10 h-10 text-[#3a7ca5] mb-4 opacity-30" />
//     <p className="text-gray-700 leading-relaxed mb-6 text-lg italic">"{testimonial.quote}"</p>
//     <div>
//       <p className="font-bold text-gray-900 text-sm">{testimonial.author}</p>
//       <p className="text-gray-500 text-sm">{testimonial.role}</p>
//     </div>
//   </motion.div>
// );

const AboutPage: React.FC = () => {
  return (
    <div className="bg-white w-full min-h-screen overflow-x-hidden">
      
      {/* Hero Section */}
      <section className="relative pt-32 pb-20 px-4 sm:px-6 lg:px-8 min-h-[80vh] flex items-center">
        <video 
          src="https://videos.pexels.com/video-files/9694443/9694443-hd_1920_1080_25fps.mp4"
          autoPlay loop muted playsInline className="absolute inset-0 w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-br from-[#3a7ca5]/90 to-[#1B4965]/90"></div>

        <motion.div 
          initial="hidden"
          animate="visible"
          variants={staggerContainer}
          className="relative z-10 max-w-6xl mx-auto text-center text-white"
        >
          <motion.div variants={fadeInUp} className="inline-flex items-center px-4 py-2 bg-white/20 backdrop-blur-sm rounded-full mb-6">
            <Sparkles className="w-4 h-4 mr-2" />
            <span className="text-sm font-semibold">Trusted by Thousands</span>
          </motion.div>

          <motion.h1 variants={fadeInUp} className="text-5xl md:text-7xl font-serif font-bold mb-6">
            About Floating Theraphy
          </motion.h1>

          <motion.p variants={fadeInUp} className="text-xl md:text-2xl text-blue-100 mb-12 max-w-3xl mx-auto">
            Empowering health through expert care and proven results since 2009.
          </motion.p>

          <motion.div variants={staggerContainer} className="grid grid-cols-2 md:grid-cols-4 gap-6">
            {stats.map((stat, index) => (
              <motion.div key={index} variants={scaleIn} className="bg-white/10 backdrop-blur-sm rounded-2xl p-6">
                <p className="text-4xl md:text-5xl font-serif font-bold mb-2">{stat.number}</p>
                <p className="text-sm md:text-base text-blue-100">{stat.label}</p>
              </motion.div>
            ))}
          </motion.div>
        </motion.div>
      </section>

      {/* Our Story Section */}
      <section className="py-24 px-4 sm:px-6 lg:px-8 overflow-hidden">
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
            <motion.div 
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true }}
              variants={staggerContainer}
            >
              <motion.div variants={fadeInUp} className="inline-flex items-center px-4 py-2 bg-blue-50 rounded-full mb-6">
                <span className="text-sm font-bold text-[#3a7ca5] uppercase tracking-wider">Our Story</span>
              </motion.div>
              <motion.h2 variants={fadeInUp} className="text-4xl md:text-5xl font-serif font-bold text-gray-900 mb-6">
                Healing Through Alignment
              </motion.h2>
              <motion.div variants={fadeInUp} className="space-y-6 text-gray-600 text-lg">
                <p>At Floating Theraphy, we believe true health begins with proper alignment. Our mission is simple: to help people move freely and live without pain.</p>
                <p>Founded by Dr. Sarah Mitchell, our practice has grown into a comprehensive wellness center where we prioritize long-term partnerships over quick fixes.</p>
              </motion.div>
              <motion.div variants={staggerContainer} className="mt-8 space-y-4">
                {["Personalized treatment plans", "Evidence-based techniques", "Holistic approach"].map((item, i) => (
                  <motion.div key={i} variants={fadeInUp} className="flex items-center">
                    <CheckCircle className="w-5 h-5 text-[#3a7ca5] mr-3" />
                    <span className="text-gray-700">{item}</span>
                  </motion.div>
                ))}
              </motion.div>
            </motion.div>

            <motion.div 
              initial={{ opacity: 0, x: 50 }}
              whileInView={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.8 }}
              className="relative"
            >
              <div className="rounded-3xl overflow-hidden shadow-2xl">
                <img src="/GettyImages-2222455931-683x1024.jpg" alt="Story" className="w-full h-[600px] object-cover" />
              </div>
              <motion.div 
                initial={{ scale: 0 }}
                whileInView={{ scale: 1 }}
                className="absolute -bottom-6 -left-6 bg-white rounded-2xl p-8 shadow-2xl border border-blue-50"
              >
                <p className="text-4xl font-serif font-bold text-[#3a7ca5]">15+</p>
                <p className="text-sm text-gray-600">Years of Excellence</p>
              </motion.div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Core Values */}
      <section className="py-24 bg-gray-50 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <motion.div 
            initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fadeInUp}
            className="text-center mb-16"
          >
            <h2 className="text-4xl font-serif font-bold mb-4">What Makes Us Different</h2>
            <p className="text-gray-600 max-w-2xl mx-auto">Our commitment goes beyond treatment—it's about transforming lives.</p>
          </motion.div>
          <motion.div 
            initial="hidden" whileInView="visible" viewport={{ once: true }} variants={staggerContainer}
            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8"
          >
            {coreValues.map((value, i) => <ValueCard key={i} {...value} />)}
          </motion.div>
        </div>
      </section>

      {/* Team Section */}
      <section className="py-24 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <motion.div 
            initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fadeInUp}
            className="text-center mb-16"
          >
            <h2 className="text-4xl font-serif font-bold mb-4">Meet Our Expert Therapists</h2>
          </motion.div>
          <motion.div 
            initial="hidden" whileInView="visible" viewport={{ once: true }} variants={staggerContainer}
            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8"
          >
            {teamMembers.map((member, i) => <TeamMemberCard key={i} member={member} />)}
          </motion.div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-24 px-4">
        <motion.div 
          initial={{ opacity: 0, scale: 0.95 }}
          whileInView={{ opacity: 1, scale: 1 }}
          className="max-w-5xl mx-auto rounded-[3rem] bg-gradient-to-br from-[#3a7ca5] to-[#1B4965] p-12 md:p-20 text-center text-white shadow-2xl overflow-hidden relative"
        >
          <div className="absolute top-0 left-0 w-full h-full opacity-10 pointer-events-none">
            <div className="absolute top-0 left-0 w-64 h-64 bg-white rounded-full blur-3xl opacity-20"></div>
          </div>
          <Users className="w-16 h-16 mx-auto mb-8 text-blue-100" />
          <h2 className="text-4xl md:text-6xl font-serif font-bold mb-8">Ready to Start?</h2>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <motion.button whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }} className="px-10 py-4 bg-white text-[#3a7ca5] font-bold rounded-full">
              Book Your First Visit
            </motion.button>
            <motion.button whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }} className="px-10 py-4 bg-white/20 backdrop-blur-sm text-white font-bold rounded-full">
              Learn More
            </motion.button>
          </div>
        </motion.div>
      </section>
    </div>
  );
};
export default AboutPage;
