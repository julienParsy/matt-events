import React, { useContext } from "react";
import EditablePage from "../components/content/EditablePage";
import { AuthContext } from "../contexts/AuthContext";

export default function PrivacyPolicyPage() {
    const { token } = useContext(AuthContext);
    const isAdmin = !!token;

    return <EditablePage slug="privacy-policy" isAdmin={isAdmin} />;
}
