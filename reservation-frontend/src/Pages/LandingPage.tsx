import { Header } from "../Components/Header/Header";
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
        </div>
    );
}