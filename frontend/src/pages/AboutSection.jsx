import React, { useContext } from "react";
import EditablePage from "../components/EditablePage";
import { AuthContext } from "../contexts/AuthContext";

export default function AboutSection() {
    const { token } = useContext(AuthContext);
    const isAdmin = !!token;

    return <EditablePage slug="about" isAdmin={isAdmin} jwt={token} />;
}
