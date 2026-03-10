import { Footer } from "../Components/Footer/Footer";
import { Header } from "../Components/Header/Header";
import { SectionFAQ } from "../Components/SectionFAQ/SectionFAQ";
import { SectionFreeTrial } from "../Components/SectionFreeTrial/SectionFreeTrial";
import { SectionOne } from "../Components/SectionOne/SectionOne";
import { SectionPlans } from "../Components/SectionPlans/SectionPlans";
import { SectionQuote } from "../Components/SectionQuote/SectionQuote";
import { SectionStatistics } from "../Components/SectionStatistics/SectionStatistics";
import { SectionToolsAndData } from "../Components/SectionToolsAndData/SectionToolsAndData";

export function LandingPage() {
    return (
        <div>
            <Header />
            <SectionOne />
            <SectionToolsAndData />
            <SectionStatistics />
            <SectionQuote />
            <SectionPlans />
            <SectionFAQ />
            <SectionFreeTrial />
            <Footer />
        </div>
    );
}