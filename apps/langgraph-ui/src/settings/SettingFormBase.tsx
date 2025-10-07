import React, { useState, useEffect, useCallback, ChangeEvent } from "react";

interface SettingFormBaseProps<T> {
    settingKey: string;
    initialData: T;
    children: (data: T, handleChange: (e: ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => void) => React.ReactNode;
}

function SettingFormBase<T extends Record<string, any>>({ settingKey, initialData, children }: SettingFormBaseProps<T>) {
    const [formData, setFormData] = useState<T>(initialData);

    useEffect(() => {
        try {
            const storedData = localStorage.getItem(settingKey);
            if (storedData) {
                setFormData(JSON.parse(storedData));
            }
        } catch (error) {
            console.error(`Error reading from localStorage for key ${settingKey}:`, error);
        }
    }, [settingKey]);

    useEffect(() => {
        try {
            localStorage.setItem(settingKey, JSON.stringify(formData));
        } catch (error) {
            console.error(`Error writing to localStorage for key ${settingKey}:`, error);
        }
    }, [formData, settingKey]);

    const handleChange = useCallback((e: ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
        const { name, value, type, checked } = e.target as HTMLInputElement;
        setFormData((prevData) => ({
            ...prevData,
            [name]: type === "checkbox" ? checked : value,
        }));
    }, []);

    return <>{children(formData, handleChange)}</>;
}

export default SettingFormBase;
