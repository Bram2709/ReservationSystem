import style from './SectionToolsAndData.module.css';

export function SectionToolsAndData() {


    const svgimg = <svg className="flex-shrink-0 w-5 h-5 text-purple-500 dark:text-purple-400" fill="currentColor" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg"><path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clip-rule="evenodd"></path></svg>;


    return (
        <section className={style.section}>
            <div className={style.contentWrapper}>
                <div className={style.sectionData}>
                    <div className={style.textContent}>
                        <h2 className={style.heading}>Work with tools you already use</h2>
                        <p className={style.paragraph}>Our reservation system seamlessly integrates with popular tools like Google Calendar, Microsoft Outlook, and Slack. Manage your reservations without switching platforms.</p>
                        <ul className={style.list}>
                            <li className={style.listItem}>{svgimg}<span>Google Calendar</span></li>
                            <li className={style.listItem}>{svgimg}<span>Microsoft Outlook</span></li>
                            <li className={style.listItem}>{svgimg}<span>Slack</span></li>
                        </ul>
                        <p className={style.paragraph}>Deliver great service experiences fast - without the complexity of traditional ITSM solutions.</p>
                    </div>
                    <img className={style.image} src="/testdata.png" alt="Test Logo" />
                </div>

                <div className={`${style.sectionData} ${style.section2}`} >
                    <img className={style.image} src="/testdata2.png" alt="Test Logo" />
                    <div className={style.textContent}>
                        <h2 className={style.heading}>Data-Driven Insights</h2>
                        <p className={style.paragraph}>Deliver great service experiences fast - without the complexity of traditional ITSM solutions. Accelerate critical development work, eliminate toil, and deploy changes with ease.</p>
                        <ul className={style.list}>
                            <li className={style.listItem}>{svgimg}<span>Dynamic reports and dashboards</span></li>
                            <li className={style.listItem}>{svgimg}<span>Advanced analytics</span></li>
                            <li className={style.listItem}>{svgimg}<span>Customizable metrics</span></li>
                            <li className={style.listItem}>{svgimg}<span>Development workflow</span></li>
                            <li className={style.listItem}>{svgimg}<span>Knowledge management</span></li>
                        </ul>
                        <p className={style.paragraph}>Deliver great service experiences fast - without the complexity of traditional ITSM solutions.</p>
                    </div>
                </div>
            </div>
        </section>
    );
}