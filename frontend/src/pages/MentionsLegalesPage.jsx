// @feature pages — Mentions légales
import React, { useContext } from "react";
import EditablePage from "../components/content/EditablePage";
import { AuthContext } from "../contexts/AuthContext";

export default function MentionsLegalesPage() {
    const { token } = useContext(AuthContext);
    const isAdmin = !!token;

    // Slug = ligne correspondante de la table pages
    return <EditablePage slug="mentions-legales" isAdmin={isAdmin} jwt={token} />;
}
