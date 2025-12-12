"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
    Mail,
    Calendar,
    Loader2,
    Save,
    AlertCircle,
    CheckCircle,
    Trash2,
} from "lucide-react";
import { useAuth } from "@/lib/auth/context";
import { Button } from "@/app/components/ui/Button";
import { Input } from "@/app/components/ui/Input";

const DEFAULT_PROFILE_IMAGE = "/profile_default.webp";

export default function ProfilePage() {
    const router = useRouter();
    const { user, isAuthenticated, isLoading: authLoading, updateUser } = useAuth();

    const [formData, setFormData] = useState({
        firstName: "",
        lastName: "",
        displayName: "",
        phone: "",
        organization: "",
    });
    const [loading, setLoading] = useState(false);
    const [removingImage, setRemovingImage] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [success, setSuccess] = useState(false);

    // Redirect if not authenticated
    useEffect(() => {
        if (!authLoading && !isAuthenticated) {
            router.push("/login?redirect=/profile");
        }
    }, [authLoading, isAuthenticated, router]);

    // Populate form with user data
    useEffect(() => {
        if (user) {
            setFormData({
                firstName: user.first_name || "",
                lastName: user.last_name || "",
                displayName: user.display_name || "",
                phone: user.phone || "",
                organization: user.organization || "",
            });
        }
    }, [user]);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target;
        setFormData((prev) => ({ ...prev, [name]: value }));
        setSuccess(false);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError(null);
        setSuccess(false);

        try {
            setLoading(true);

            const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8080/api/v1";
            const authData = localStorage.getItem("dooform_auth");
            const token = authData ? JSON.parse(authData).accessToken : null;

            const response = await fetch(`${API_BASE_URL}/auth/profile`, {
                method: "PUT",
                headers: {
                    "Content-Type": "application/json",
                    ...(token ? { Authorization: `Bearer ${token}` } : {}),
                },
                body: JSON.stringify({
                    first_name: formData.firstName,
                    last_name: formData.lastName,
                    display_name: formData.displayName,
                    phone: formData.phone,
                    organization: formData.organization,
                }),
            });

            const data = await response.json();

            if (!response.ok || !data.success) {
                throw new Error(data.message || "ไม่สามารถอัปเดตโปรไฟล์ได้");
            }

            // Update auth context with new user data
            if (data.data?.user) {
                updateUser(data.data.user);
            }

            setSuccess(true);
        } catch (err) {
            console.error("Profile update error:", err);
            setError(
                err instanceof Error
                    ? err.message
                    : "เกิดข้อผิดพลาดในการอัปเดตโปรไฟล์"
            );
        } finally {
            setLoading(false);
        }
    };

    const handleRemoveProfileImage = async () => {
        if (!confirm("คุณต้องการลบรูปโปรไฟล์หรือไม่?")) return;

        setError(null);
        setSuccess(false);

        try {
            setRemovingImage(true);

            const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8080/api/v1";
            const authData = localStorage.getItem("dooform_auth");
            const token = authData ? JSON.parse(authData).accessToken : null;

            const response = await fetch(`${API_BASE_URL}/auth/profile/picture`, {
                method: "DELETE",
                headers: {
                    ...(token ? { Authorization: `Bearer ${token}` } : {}),
                },
            });

            // Handle response - some APIs return empty body on DELETE
            const responseText = await response.text();
            let data = { success: true, message: "" };

            if (responseText) {
                try {
                    data = JSON.parse(responseText);
                } catch {
                    // If response is not JSON, check status code
                    if (!response.ok) {
                        throw new Error("ไม่สามารถลบรูปโปรไฟล์ได้");
                    }
                }
            }

            if (!response.ok || (data && !data.success)) {
                throw new Error(data?.message || "ไม่สามารถลบรูปโปรไฟล์ได้");
            }

            // Update auth context - clear picture_url
            updateUser({ picture_url: undefined });
            setSuccess(true);
        } catch (err) {
            console.error("Remove profile image error:", err);
            setError(
                err instanceof Error
                    ? err.message
                    : "เกิดข้อผิดพลาดในการลบรูปโปรไฟล์"
            );
        } finally {
            setRemovingImage(false);
        }
    };

    const formatDate = (dateString: string) => {
        if (!dateString) return "-";
        const cleanDateString = dateString.replace("Z", "");
        const date = new Date(cleanDateString);
        return date.toLocaleDateString("th-TH", {
            year: "numeric",
            month: "long",
            day: "numeric",
        });
    };

    // Show loading while checking auth
    if (authLoading) {
        return (
            <div className="min-h-screen bg-surface-alt flex items-center justify-center">
                <Loader2 className="w-8 h-8 text-primary animate-spin" />
            </div>
        );
    }

    // Don't render if not authenticated
    if (!isAuthenticated || !user) {
        return (
            <div className="min-h-screen bg-surface-alt flex items-center justify-center">
                <Loader2 className="w-8 h-8 text-primary animate-spin" />
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-surface-alt">
            <div className="container-main section-padding">
                {/* Header */}
                <div className="mb-8">
                    <h1 className="text-h2 text-foreground">ตั้งค่าบัญชี</h1>
                    <p className="text-body text-text-muted">
                        จัดการข้อมูลโปรไฟล์ของคุณ
                    </p>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    {/* Left - Profile Card */}
                    <div className="lg:col-span-1">
                        <div className="bg-background border border-border-default rounded-xl p-6">
                            <div className="flex flex-col items-center text-center">
                                <div className="relative mb-4">
                                    <img
                                        src={user.picture_url || DEFAULT_PROFILE_IMAGE}
                                        alt={user.display_name || user.email || "Profile"}
                                        className="rounded-full object-cover w-24 h-24"
                                    />
                                    {user.picture_url && (
                                        <button
                                            onClick={handleRemoveProfileImage}
                                            disabled={removingImage}
                                            className="absolute -bottom-1 -right-1 p-1.5 bg-red-500 hover:bg-red-600 text-white rounded-full shadow-md transition-colors disabled:opacity-50"
                                            title="ลบรูปโปรไฟล์"
                                        >
                                            {removingImage ? (
                                                <Loader2 className="w-4 h-4 animate-spin" />
                                            ) : (
                                                <Trash2 className="w-4 h-4" />
                                            )}
                                        </button>
                                    )}
                                </div>
                                <h2 className="text-h4 text-foreground">
                                    {user.display_name ||
                                        `${user.first_name || ""} ${user.last_name || ""}`.trim() ||
                                        user.email?.split("@")[0] || "User"}
                                </h2>
                                <p className="text-body-sm text-text-muted">{user.email}</p>

                                {user.auth_provider && (
                                    <div className="mt-4 flex items-center gap-2">
                                        <span className="text-caption text-text-muted">
                                            เข้าสู่ระบบผ่าน:
                                        </span>
                                        <span className="inline-flex items-center px-2 py-1 rounded-full text-caption font-medium bg-surface-alt text-text-default">
                                            {user.auth_provider === "line" ? "LINE" : user.auth_provider}
                                        </span>
                                    </div>
                                )}
                            </div>

                            <div className="mt-6 pt-6 border-t border-border-default space-y-4">
                                <div className="flex items-center gap-3 text-body-sm">
                                    <Calendar className="w-4 h-4 text-text-muted" />
                                    <span className="text-text-muted">สมาชิกตั้งแต่:</span>
                                    <span className="text-foreground">
                                        {formatDate(user.created_at || "")}
                                    </span>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Right - Edit Form */}
                    <div className="lg:col-span-2">
                        <div className="bg-background border border-border-default rounded-xl p-6">
                            <h3 className="text-h4 text-foreground mb-6">แก้ไขข้อมูล</h3>

                            <form onSubmit={handleSubmit} className="space-y-6">
                                {/* Name Fields */}
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                    <Input
                                        label="ชื่อ"
                                        name="firstName"
                                        type="text"
                                        placeholder="ชื่อ"
                                        value={formData.firstName}
                                        onChange={handleChange}
                                        disabled={loading}
                                    />
                                    <Input
                                        label="นามสกุล"
                                        name="lastName"
                                        type="text"
                                        placeholder="นามสกุล"
                                        value={formData.lastName}
                                        onChange={handleChange}
                                        disabled={loading}
                                    />
                                </div>

                                {/* Display Name */}
                                <Input
                                    label="ชื่อที่แสดง"
                                    name="displayName"
                                    type="text"
                                    placeholder="ชื่อที่ต้องการให้แสดง"
                                    value={formData.displayName}
                                    onChange={handleChange}
                                    disabled={loading}
                                />

                                {/* Email (Read-only) */}
                                <div className="flex flex-col gap-1 w-full">
                                    <label className="text-sm font-medium text-foreground">
                                        อีเมล
                                    </label>
                                    <div className="flex items-center gap-3 w-full p-2.5 text-sm text-text-muted bg-surface-alt border border-border-default rounded-xl">
                                        <Mail className="w-4 h-4" />
                                        {user.email}
                                    </div>
                                    <span className="text-xs text-text-muted">
                                        ไม่สามารถเปลี่ยนอีเมลได้
                                    </span>
                                </div>

                                {/* Phone */}
                                <Input
                                    label="เบอร์โทรศัพท์"
                                    name="phone"
                                    type="tel"
                                    placeholder="0XX-XXX-XXXX"
                                    value={formData.phone}
                                    onChange={handleChange}
                                    disabled={loading}
                                />

                                {/* Organization */}
                                <Input
                                    label="องค์กร / บริษัท"
                                    name="organization"
                                    type="text"
                                    placeholder="ชื่อองค์กรหรือบริษัท"
                                    value={formData.organization}
                                    onChange={handleChange}
                                    disabled={loading}
                                />

                                {/* Error Message */}
                                {error && (
                                    <div className="flex items-center gap-2 p-3 bg-red-50 border border-red-200 rounded-xl">
                                        <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0" />
                                        <p className="text-body-sm text-red-700">{error}</p>
                                    </div>
                                )}

                                {/* Success Message */}
                                {success && (
                                    <div className="flex items-center gap-2 p-3 bg-green-50 border border-green-200 rounded-xl">
                                        <CheckCircle className="w-5 h-5 text-green-500 flex-shrink-0" />
                                        <p className="text-body-sm text-green-700">
                                            บันทึกข้อมูลสำเร็จ
                                        </p>
                                    </div>
                                )}

                                {/* Submit Button */}
                                <div className="flex justify-end">
                                    <Button
                                        type="submit"
                                        variant="primary"
                                        disabled={loading}
                                    >
                                        {loading ? (
                                            <>
                                                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                                กำลังบันทึก...
                                            </>
                                        ) : (
                                            <>
                                                <Save className="w-4 h-4 mr-2" />
                                                บันทึกข้อมูล
                                            </>
                                        )}
                                    </Button>
                                </div>
                            </form>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
