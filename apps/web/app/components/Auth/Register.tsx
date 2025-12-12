"use client";

import { useState } from "react";
import { Button } from "@/app/components/ui/Button";
import { Input } from "@/app/components/ui/Input";

interface RegisterProps {
    background?: "default" | "alt";
}

export default function Register({ background = "alt" }: RegisterProps) {
    const [formData, setFormData] = useState({
        fullName: "",
        email: "",
        password: "",
    });
    const bgClass = background === "alt" ? "bg-surface-alt" : "bg-background";

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target;
        setFormData((prev) => ({ ...prev, [name]: value }));
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        // Handle registration logic here
        console.log("Register:", formData);
    };

    return (
        <section className={`${bgClass} font-sans`}>
            <div className="container-main section-padding flex flex-col items-center gap-9">
            {/* Header */}
            <div className="flex flex-col items-center gap-0.5 text-center w-full">
                <h2 className="text-h2 text-foreground">
                    ทดลองใช้งานฟรี
                </h2>
                <p className="text-body text-foreground">
                    เพียงสมัครสมาชิกและกรอกข้อมูลได้ทันที
                </p>
            </div>

            {/* Form */}
            <form onSubmit={handleSubmit} className="flex flex-col items-center gap-6 w-full max-w-[295px]">
                {/* Input Fields */}
                <div className="flex flex-col gap-1.5 w-full">
                    <Input
                        type="text"
                        name="fullName"
                        placeholder="ชื่อ – นามสกุล"
                        value={formData.fullName}
                        onChange={handleChange}
                        required
                    />
                    <Input
                        type="email"
                        name="email"
                        placeholder="อีเมล"
                        value={formData.email}
                        onChange={handleChange}
                        required
                    />
                    <Input
                        type="password"
                        name="password"
                        placeholder="รหัสผ่าน"
                        value={formData.password}
                        onChange={handleChange}
                        required
                    />
                </div>

                {/* Buttons */}
                <div className="flex items-center gap-3">
                    <Button type="submit" variant="primary">
                        สมัครสมาชิก
                    </Button>
                    <Button href="/login" variant="secondary">
                        มีบัญชีผู้ใช้แล้ว?
                    </Button>
                </div>
            </form>

            {/* Terms Notice */}
            <p className="text-caption text-text-muted">
                การสมัครสมาชิกถือว่าคุณได้ยินยอมให้มีการเก็บข้อมูลในการใช้งาน
            </p>
            </div>
        </section>
    );
}
