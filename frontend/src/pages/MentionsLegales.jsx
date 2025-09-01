import React, { useContext } from "react";
import EditablePage from "../components/EditablePage";
import { AuthContext } from "../contexts/AuthContext";

export default function MentionsLegales() {
    const { token } = useContext(AuthContext);
    const isAdmin = !!token;

    // Le slug doit correspondre à l’entrée côté backend/DB
    return <EditablePage slug="mentions-legales" isAdmin={isAdmin} jwt={token} />;
}
