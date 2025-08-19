import React, { useState, useEffect } from "react";
import { ArrowUp } from "lucide-react";
import styles from "../styles/components/ScrollToTopButton.module.css"; 

export default function ScrollToTopButton() {
    const [visible, setVisible] = useState(false);

    // Écoute du scroll
    useEffect(() => {
        const toggleVisibility = () => {
            if (window.scrollY > 300) setVisible(true);
            else setVisible(false);
        };

        window.addEventListener("scroll", toggleVisibility);
        return () => window.removeEventListener("scroll", toggleVisibility);
    }, []);

    // Remonter en haut
    const scrollToTop = () => {
        window.scrollTo({ top: 0, behavior: "smooth" });
    };

    return (
        visible && (
            <button className={styles.scrollToTop} onClick={scrollToTop}>
                <ArrowUp size={20} />
            </button>
        )
    );
}
