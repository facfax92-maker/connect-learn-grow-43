import Navbar from "@/components/Navbar";
import HeroSection from "@/components/HeroSection";
import StatsBar from "@/components/StatsBar";
import HowItWorks from "@/components/HowItWorks";
import PricingTable from "@/components/PricingTable";
import FeaturedTutors from "@/components/FeaturedTutors";
import SubjectsGrid from "@/components/SubjectsGrid";
import Testimonials from "@/components/Testimonials";
import Footer from "@/components/Footer";

const Index = () => {
  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <main>
        <HeroSection />
        <StatsBar />
        <HowItWorks />
        <PricingTable />
        <FeaturedTutors />
        <SubjectsGrid />
        <Testimonials />
      </main>
      <Footer />
    </div>
  );
};

export default Index;
