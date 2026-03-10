import { useState } from 'react';
import style from './SectionFAQ.module.css';


type FaqItem = {
    id: number;
    question: string;
    answer: string;
    answerClass: string;
};

const FAQS: FaqItem[] = [
    {
        id: 1,
        question: 'What is the reservation system?',
        answer:
            'Our reservation system is a software platform that allows businesses to manage their reservations efficiently and effectively. It provides a user-friendly interface for customers to make reservations online, and it also offers powerful tools for businesses to manage their reservations, such as calendar management, customer management, and reporting.',
        answerClass: style.answer1,
    },
    {
        id: 2,
        question: 'How does the reservation system work?',
        answer:
            'Our reservation system works by allowing customers to make reservations online through a user-friendly interface. Businesses can then manage these reservations using powerful tools such as calendar management, customer management, and reporting.',
        answerClass: style.answer2,
    },
    {
        id: 3,
        question: 'What is the difference between the reservation system and other similar platforms?',
        answer:
            'Our reservation system stands out from other similar platforms because of its user-friendly interface, powerful tools for businesses, and excellent customer support. We are committed to providing our customers with the best possible experience, and we are always looking for ways to improve our platform.',
        answerClass: style.answer3,
    },
    {
        id: 4,
        question: 'How can I get started with the reservation system?',
        answer:
            'To get started with our reservation system, simply sign up for an account on our website. Once you have an account, you can start making reservations and managing them using our powerful tools such as calendar management, customer management, and reporting.',
        answerClass: style.answer4,
    },
];

export function SectionFAQ() {
    const [open, setOpen] = useState<Record<number, boolean>>({});

    const toggle = (id: number) => setOpen(prev => ({ ...prev, [id]: !prev[id] }));

    


    return (
        <section className={style.section}>
            <div className={style.contentWrapper}>
                <h2 className={style.heading}>Frequently Asked Questions</h2>
                <div className={style.faqWrapper}>
                    {FAQS.map(item => (
                        <div key={item.id}>
                            <h3 className={style.question}>
                                <button
                                    className={`${style.questionButton} ${open[item.id] ? style.openButton : ''}`}
                                    onClick={() => toggle(item.id)}
                                >
                                    {item.question}
                                    <svg
                                        data-accordion-icon=""
                                        className={`${style.svgIcon} ${open[item.id] ? style.svgRotate : ''}`}
                                        fill="currentColor"
                                        viewBox="0 0 20 20"
                                        xmlns="http://www.w3.org/2000/svg"
                                    >
                                        <path
                                            fillRule="evenodd"
                                            d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z"
                                            clipRule="evenodd"
                                        />
                                    </svg>
                                </button>
                            </h3>
                            <div className={`${item.answerClass} ${open[item.id] ? '' : style.hidden}`}>
                                <div className={style.answerWrapper}>
                                    <p className={style.paragraph}>{item.answer}</p>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </section>
    );
}