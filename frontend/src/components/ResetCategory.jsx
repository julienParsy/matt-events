import { useEffect } from 'react';

export default function ResetCategory({ onReset }) {
    useEffect(() => {
        onReset();
    }, []);

    return null;
}
