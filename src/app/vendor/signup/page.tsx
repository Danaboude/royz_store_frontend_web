'use client';
import Footer from '@/components/Footer';
import { useI18n } from '@/contexts/I18nContext';
import Image from 'next/image';

import React, { useRef, useState, useEffect } from 'react';
import { Eye, EyeOff, UploadCloud, ArrowLeft, ArrowRight, X } from 'lucide-react';
import { signupVendor } from '@/services/api-client'; // Adjust the import path as necessary

// Define a type for subscription packages
interface SubscriptionPackage {
    package_id: number;
    vendor_type_id: number;
    name_en: string;
    name_ar: string;
    description_en: string;
    description_ar: string;
    price: number;
    duration_months: number;
    features_en: string;
    features_ar: string;
    is_active: number;
    is_popular: number;
    created_at: string;
}

export default function VendorSignupPage() {
    const { t, locale } = useI18n();
    const isRTL = locale === 'ar';

    // Form state
    const [form, setForm] = useState({
        fullNameEn: '',
        email: '',
        phone: '',
        password: '',
        confirmPassword: '',
        profileImage: null as File | null,
        vendorType: '',
        address: '', // Added address state
        // New fields for vendor details
        owner_name: '',
        identity_number: '',
        tax_number: '',
        commercial_registration_number: '',
        identity_doc: null as File | null,
        special_license_doc: null as File | null,
        commercial_registration_doc: null as File | null,
        tax_registration_doc: null as File | null,
        signature_authorization_doc: null as File | null,
        lease_or_ownership_doc: null as File | null,

    });
    const [errors, setErrors] = useState<Record<string, string>>({});
    const [imagePreview, setImagePreview] = useState<string | null>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);
    const [showPassword, setShowPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);
    const [stage, setStage] = useState(0);
    const [packages, setPackages] = useState<SubscriptionPackage[]>([]);
    const [loadingPackages, setLoadingPackages] = useState(false);
    const [packagesError, setPackagesError] = useState<string | null>(null);
    const [selectedPackageId, setSelectedPackageId] = useState<number | null>(null);
    // Add state for duration and num_products
    const [selectedDuration, setSelectedDuration] = useState<number>(30); // 14 for 2 weeks, 30 for 1 month
    const [numProducts, setNumProducts] = useState<number>(1);

    // Progress bar stages
    const stages = [
        t('vendorSignup.stages.profileDetails'),
        t('vendorSignup.stages.privacyPolicy'),
        t('vendorSignup.stages.data'),
        t('vendorSignup.stages.review'), // New stage for account review

    ];

    // Helper component for file uploads
    const FileUpload = ({ name, label, onChange, error, t, file }: { name: string, label: string, onChange: (e: React.ChangeEvent<HTMLInputElement>) => void, error?: string, t: (key: string) => string, file: File | null }) => {
        const fileInputRef = useRef<HTMLInputElement>(null);
        const [preview, setPreview] = useState<string | null>(null);

        useEffect(() => {
            if (file) {
                if (file.type.startsWith('image/')) {
                    const reader = new FileReader();
                    reader.onloadend = () => {
                        setPreview(reader.result as string);
                    };
                    reader.readAsDataURL(file);
                } else {
                    setPreview(null); // No preview for non-images like PDF
                }
            } else {
                setPreview(null);
            }
            // Clean up
            return () => {
                if (preview) {
                    URL.revokeObjectURL(preview);
                }
            };
        }, [file]);

        const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
            onChange(e);
        };

        const onRemove = () => {
            // To "remove" we can create a synthetic event with empty files list
            // and pass it to the parent's handleChange
            const syntheticEvent = {
                target: {
                    name: name,
                    files: new DataTransfer().files, // Empty FileList
                    value: ''
                }
            } as unknown as React.ChangeEvent<HTMLInputElement>;
            onChange(syntheticEvent);
        }

        return (
            <div className="flex flex-col">
                <label className="block font-bold mb-1 text-[#2C2C54]">{label}</label>
                <div
                    className="w-full border-2 border-dashed border-gray-300 rounded-lg p-4 text-center cursor-pointer hover:border-[#2C2C54] transition-colors relative min-h-[120px] flex justify-center items-center"
                    onClick={() => !file && fileInputRef.current?.click()}
                >
                    <input
                        ref={fileInputRef}
                        type="file"
                        name={name}
                        accept="image/*,application/pdf"
                        className="hidden"
                        onChange={handleFileChange}
                    />
                    {file ? (
                        <div className="flex flex-col items-center justify-center">
                            {preview ? (
                                <Image src={preview} alt="preview" width={64} height={64} className="h-16 w-auto object-contain rounded-md mb-2" />
                            ) : (
                                <svg className="w-12 h-12 text-gray-400 mb-2" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>
                            )}
                            <p className="text-sm text-gray-700 font-semibold truncate max-w-full px-2">{file.name}</p>
                            <button
                                type="button"
                                onClick={onRemove}
                                className="absolute top-1 right-1 bg-red-500 text-white rounded-full p-1 text-xs leading-none hover:bg-red-600"
                                aria-label="Remove file"
                            >
                                <X size={12} />
                            </button>
                        </div>
                    ) : (
                        <div className="flex flex-col items-center justify-center">
                            <UploadCloud className="w-8 h-8 text-gray-400 mb-2" />
                            <p className="text-sm text-gray-500">{t('vendorSignup.dragAndDrop')}</p>
                        </div>
                    )}
                </div>
                {error && <span className="text-xs text-red-500 mt-1">{error}</span>}
            </div>
        );
    };

    // Handle input change
    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value, files } = e.target;

        if (files) { // This will handle all file inputs
            const file = files[0]; // Can be undefined if file is removed
            if (!file) { // File removed
                setForm(prev => ({ ...prev, [name]: null }));
                if (name === 'profileImage') {
                    setImagePreview(null);
                }
                return;
            }

            if (name === 'profileImage') {
                if (!file.type.startsWith('image/')) {
                    setErrors((prev) => ({ ...prev, profileImage: t('profileImage.fileTypeError') as string }));
                    return;
                }
                if (file.size > 5 * 1024 * 1024) { // 5MB
                    setErrors((prev) => ({ ...prev, profileImage: t('profileImage.fileSizeError') as string }));
                    return;
                }
                setForm((prev) => ({ ...prev, profileImage: file }));
                setImagePreview(URL.createObjectURL(file));
            } else {
                // Handle other file inputs (PDFs, images)
                if (file.size > 10 * 1024 * 1024) { // 10MB limit for documents
                    setErrors((prev) => ({ ...prev, [name]: t('vendorSignup.errors.fileTooLarge') as string }));
                    return;
                }
                setForm((prev) => ({ ...prev, [name]: file }));
            }
            // Clear error for the current field
            setErrors((prev) => {
                const rest = { ...prev };
                delete rest[name];
                return rest;
            });
        } else {
            setForm((prev) => ({ ...prev, [name]: value }));
            // Clear error for the current field
            setErrors((prev) => {
                const rest = { ...prev };
                delete rest[name];
                return rest;
            });
        }
    };

    // Validate form
    const validate = () => {
        const newErrors: Record<string, string> = {};
        if (!form.fullNameEn) newErrors.fullNameEn = t('vendorSignup.errors.fullNameEn') as string;
        if (!form.email) newErrors.email = t('vendorSignup.errors.email') as string;
        const phoneRegex = /^\+9639\d{8}$/;
        if (!form.phone) {
            newErrors.phone = t('vendorSignup.errors.phone') as string;
        } else if (!phoneRegex.test(form.phone)) {
            newErrors.phone = t('vendorSignup.errors.phoneFormat') as string || 'Phone must be in format +963999999999';
        }
        if (!form.address) newErrors.address = t('vendorSignup.errors.address') as string; // Validate address
        if (!form.password) newErrors.password = t('vendorSignup.errors.password') as string;
        if (!form.confirmPassword) newErrors.confirmPassword = t('vendorSignup.errors.confirmPassword') as string;
        if (form.password && form.confirmPassword && form.password !== form.confirmPassword) newErrors.confirmPassword = t('vendorSignup.errors.passwordsNotMatch') as string;
        if (!form.lease_or_ownership_doc) newErrors.lease_or_ownership_doc = t('vendorSignup.errors.upload') as string;
        if (!form.signature_authorization_doc) newErrors.signature_authorization_doc = t('vendorSignup.errors.upload') as string;
        if (!form.commercial_registration_doc) newErrors.commercial_registration_doc = t('vendorSignup.errors.upload') as string;
        if (!form.special_license_doc) newErrors.special_license_doc = t('vendorSignup.errors.upload') as string;
        if (!form.identity_doc) newErrors.identity_doc = t('vendorSignup.errors.upload') as string;
        if (!form.commercial_registration_number) newErrors.commercial_registration_number = t('vendorSignup.errors.filed') as string;
        if (!form.tax_number) newErrors.tax_number = t('vendorSignup.errors.filed') as string;
        if (!form.identity_number) newErrors.identity_number = t('vendorSignup.errors.filed') as string;
        if (!form.owner_name) newErrors.owner_name = t('vendorSignup.errors.filed') as string;

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    // Handle submit
    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (stage === 0) {
            if (!validate()) return;
            try {
                let apiUrl = process.env.NEXT_PUBLIC_API_URL || 'https://api.royzstore.com';
                apiUrl = apiUrl.replace(/\/?api\/?$/, '');
                const res = await fetch(`${apiUrl}/auth/check-email`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ email: form.email })
                });
                const data = await res.json();
                if (data.exists) {
                    setErrors(prev => ({ ...prev, email: t('vendorSignup.errors.emailExists') as string }));
                    return;
                }
                setStage(1);
            } catch {
                setErrors(prev => ({ ...prev, email: t('vendorSignup.errors.emailCheckFailed') as string }));
            }
        } else if (stage === 1) {
            setStage(2);
        } else if (stage === 2) {
            const formData = new FormData();

            // Append standard form data
            formData.append('name', form.fullNameEn);
            formData.append('email', form.email);
            formData.append('password', form.password);
            formData.append('phone', form.phone);
            formData.append('address', form.address);
            if (selectedPackageId) {
                formData.append('package_id', selectedPackageId.toString());
            }
            formData.append('vendor_type_id', form.vendorType);
            formData.append('duration_months', (selectedDuration === 30 ? 1 : 0).toString());
            formData.append('duration_days', (selectedDuration === 14 ? 14 : 0).toString());
            formData.append('num_products', numProducts.toString());
            const roleId = form.vendorType === 'seller' ? 3 : form.vendorType === 'real_estate' ? 4 : 5;
            formData.append('roleId', roleId.toString());

            // Append vendor details
            formData.append('owner_name', form.owner_name);
            formData.append('identity_number', form.identity_number);
            formData.append('tax_number', form.tax_number);
            formData.append('commercial_registration_number', form.commercial_registration_number);

            // Append files
            //  if (form.profileImage) formData.append('profileImage', form.profileImage);
            if (form.identity_doc) formData.append('identity_doc', form.identity_doc);
            if (form.special_license_doc) formData.append('special_license_doc', form.special_license_doc);
            if (form.commercial_registration_doc) formData.append('commercial_registration_doc', form.commercial_registration_doc);
            if (form.tax_registration_doc) formData.append('tax_registration_doc', form.tax_registration_doc);
            if (form.signature_authorization_doc) formData.append('signature_authorization_doc', form.signature_authorization_doc);
            if (form.lease_or_ownership_doc) formData.append('lease_or_ownership_doc', form.lease_or_ownership_doc);

          

            try {
                const response = await signupVendor(formData);
                if (response) {
                    setStage(3);
                }
            } catch (error) {
                console.log(error);
                setErrors(prev => ({ ...prev, signup: 'Signup failed. Please try again.' }));
            }
        }
    };



    // Fetch packages when entering stage 2
    useEffect(() => {
        if (stage === 2 && form.vendorType) {
            const vendorTypeId = form.vendorType === 'seller' ? 1 :
                form.vendorType === 'real_estate' ? 2 :
                    form.vendorType === 'factory_owner' ? 3 : null;
            if (!vendorTypeId) return;
            setLoadingPackages(true);
            setPackagesError(null);
            fetch(`${process.env.NEXT_PUBLIC_API_URL}/subscriptions/packages/vendor-type/${vendorTypeId}`)
                .then(res => res.json())
                .then(data => {
                    setPackages(data);
                    setLoadingPackages(false);
                })
                .catch(() => {
                    setPackagesError(t('vendorSignup.packagesError') as string || 'حدث خطأ أثناء جلب الباقات');
                    setLoadingPackages(false);
                });
        }
    }, [stage, form.vendorType, t]);


    return (
        <div className={`min-h-screen flex flex-col bg-[#F7F7FA] font-tajawal ${isRTL ? 'rtl' : 'ltr'}`} dir={isRTL ? 'rtl' : 'ltr'}>
            <main className="flex-1 flex flex-col items-center justify-center py-8">
                {/* Progress Bar */}
                <div className="w-full max-w-4xl flex flex-col items-center mb-8 px-4">
                    <h1 className="text-3xl md:text-4xl font-extrabold text-[#2C2C54] mb-6 text-center">{t('vendorSignup.title') as string || 'تسجيل البائع'}</h1>
                    <div className="relative w-full flex flex-col items-center">
                        {/* Progress Line */}
                        <div
                            className="absolute h-1 z-0"
                            style={{
                                left: '24px',
                                right: '24px',
                                top: '36px',
                                background: `linear-gradient(to left, #22c55e ${(stage / (stages.length - 1)) * 100}%, #e5e7eb ${(stage / (stages.length - 1)) * 100}%)`,
                            }}
                        />
                        <div className="flex w-full justify-between items-center z-10">
                            {stages.map((stageLabel, idx) => (
                                <div
                                    key={idx}
                                    className="flex flex-col items-center flex-1 min-w-0"
                                >
                                    <div className={`relative flex flex-col items-center`}>
                                        <div className={`w-12 h-12 flex items-center justify-center rounded-full text-lg font-bold border-2 transition-all duration-300 mb-2
                                            ${idx < stage ? 'bg-green-500 border-green-500 text-white shadow-lg' : idx === stage ? 'bg-[#2C2C54] border-[#2C2C54] text-white shadow-lg' : 'bg-gray-200 border-gray-200 text-gray-400'}`}
                                            style={{ marginBottom: '8px', marginTop: '0px', zIndex: 1 }}
                                        >
                                            {idx < stage ? (
                                                <svg width="28" height="28" fill="none" viewBox="0 0 24 24" stroke="currentColor" className="text-white"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M5 13l4 4L19 7" /></svg>
                                            ) : (
                                                idx + 1
                                            )}
                                        </div>
                                    </div>
                                    <span className={`mt-2 text-sm font-bold text-center whitespace-normal break-words transition-all duration-300
                                        ${idx < stage ? 'text-green-600' : idx === stage ? 'text-[#2C2C54]' : 'text-gray-400'}`}>{stageLabel as string}</span>
                                </div>
                            ))}
                        </div>
                    </div>
                    {/* Back Arrow for stages > 0 */}
                    {stage > 0 && (
                        <button
                            type="button"
                            onClick={() => setStage(stage - 1)}
                            className={`absolute top-0 ${isRTL ? 'left-0' : 'right-0'} flex items-center gap-1 text-[#2C2C54] hover:text-[#474787] font-bold mt-2`}
                            aria-label={t('common.back') as string}
                            style={{ zIndex: 2 }}
                        >
                            {isRTL ? <ArrowRight size={28} /> : <ArrowLeft size={28} />}
                            <span className="hidden md:inline">{t('common.back') as string}</span>
                        </button>
                    )}
                </div>
                {/* Stage 0: Signup Form */}
                {stage === 0 && (
                    <form onSubmit={handleSubmit} className="w-full max-w-4xl bg-white rounded-xl shadow-lg p-8 flex flex-col items-center animate-fade-in-up">
                        {/* Profile Image Upload */}
                        <div className="flex flex-col items-center mb-8">
                            <div className="relative w-24 h-24 mb-2">
                                <Image
                                    src={imagePreview || '/file.svg'}
                                    alt="profile preview"
                                    width={96}
                                    height={96}
                                    className="w-24 h-24 rounded-full object-cover border-2 border-[#2C2C54] bg-gray-100"
                                />
                                <button
                                    type="button"
                                    className="absolute bottom-0 right-0 bg-[#2C2C54] text-white rounded-full p-1 shadow hover:bg-[#474787]"
                                    onClick={() => fileInputRef.current?.click()}
                                    aria-label={t('profileImage.selectFile') as string}
                                >
                                    <svg width="20" height="20" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4" /></svg>
                                </button>
                                <input
                                    ref={fileInputRef}
                                    type="file"
                                    name="profileImage"
                                    accept="image/*"
                                    className="hidden"
                                    onChange={handleChange}
                                />
                            </div>
                            <span className="text-sm text-gray-500">{t('profileImage.title') as string || 'حمل الصورة'}</span>
                            {errors.profileImage && <span className="text-xs text-red-500 mt-1">{errors.profileImage}</span>}
                        </div>
                        {/* Form Fields */}
                        <div className="w-full grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div>
                                <label className="block font-bold mb-1 text-[#2C2C54]">{t('vendorSignup.fullNameEn') as string || 'الاسم الكامل باللغة الإنكليزية:'}</label>
                                <input
                                    type="text"
                                    name="fullNameEn"
                                    value={form.fullNameEn}
                                    onChange={handleChange}
                                    className="w-full border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-[#2C2C54]"
                                    placeholder={t('vendorSignup.fullNameEnPlaceholder') as string || 'اكتب الاسم بالكامل هنا'}
                                />
                                {errors.fullNameEn && <span className="text-xs text-red-500 mt-1">{errors.fullNameEn}</span>}
                            </div>

                            <div>
                                <label className="block font-bold mb-1 text-[#2C2C54]">{t('auth.email') as string}</label>
                                <input
                                    type="email"
                                    name="email"
                                    value={form.email}
                                    onChange={handleChange}
                                    className="w-full border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-[#2C2C54]"
                                    placeholder={t('auth.email') as string}
                                />
                                {errors.email && <span className="text-xs text-red-500 mt-1">{errors.email}</span>}
                            </div>
                            <div>
                                <label className="block font-bold mb-1 text-[#2C2C54]">{t('auth.phone') as string}</label>
                                <input
                                    type="tel"
                                    name="phone"
                                    maxLength={13}
                                    value={form.phone}
                                    onChange={handleChange}
                                    className="w-full border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-[#2C2C54]"
                                    placeholder={t('auth.phone') as string}
                                />
                                <span className="text-xs text-gray-500">+963999999999</span>
                                {errors.phone && <span className="text-xs text-red-500 mt-1">{errors.phone}</span>}
                            </div>
                            <div>
                                <label className="block font-bold mb-1 text-[#2C2C54]">{t('vendorSignup.address') as string || 'العنوان:'}</label>
                                <input
                                    type="text"
                                    name="address"
                                    value={form.address}
                                    onChange={handleChange}
                                    className="w-full border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-[#2C2C54]"
                                    placeholder={t('vendorSignup.addressPlaceholder') as string || 'أدخل عنوانك هنا'}
                                />
                                {errors.address && <span className="text-xs text-red-500 mt-1">{errors.address}</span>}
                            </div>
                            <div className="md:col-span-2">
                                <label className="block font-bold mb-1 text-[#2C2C54]">{t('vendorSignup.vendorType')}</label>
                                <div className="flex gap-4 mt-1">
                                    <label className="flex items-center gap-2">
                                        <input type="radio" name="vendorType" value="seller" checked={form.vendorType === 'seller'} onChange={handleChange} />
                                        {t('vendorSignup.vendorTypes.seller') as string}
                                    </label>
                                    <label className="flex items-center gap-2">
                                        <input type="radio" name="vendorType" value="real_estate" checked={form.vendorType === 'real_estate'} onChange={handleChange} />
                                        {t('vendorSignup.vendorTypes.realEstate') as string}
                                    </label>
                                    <label className="flex items-center gap-2">
                                        <input type="radio" name="vendorType" value="factory_owner" checked={form.vendorType === 'factory_owner'} onChange={handleChange} />
                                        {t('vendorSignup.vendorTypes.factoryOwner') as string}
                                    </label>
                                </div>
                                {errors.vendorType && <span className="text-xs text-red-500 mt-1">{errors.vendorType}</span>}
                            </div>
                            <div>
                                <label className="block font-bold mb-1 text-[#2C2C54]">{t('auth.password') as string}</label>
                                <div className="relative">
                                    <input
                                        type={showPassword ? 'text' : 'password'}
                                        name="password"
                                        value={form.password}
                                        onChange={handleChange}
                                        className="w-full border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-[#2C2C54] pr-10"
                                        placeholder={t('auth.password') as string}
                                    />
                                    <button type="button" className="absolute top-1/2 right-3 -translate-y-1/2 text-[#2C2C54]" tabIndex={-1} onClick={() => setShowPassword(v => !v)}>
                                        {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                                    </button>
                                </div>
                                {errors.password && <span className="text-xs text-red-500 mt-1">{errors.password}</span>}
                            </div>
                            <div>
                                <label className="block font-bold mb-1 text-[#2C2C54]">{t('vendorSignup.confirmPassword') as string}</label>
                                <div className="relative">
                                    <input
                                        type={showConfirmPassword ? 'text' : 'password'}
                                        name="confirmPassword"
                                        value={form.confirmPassword}
                                        onChange={handleChange}
                                        className="w-full border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-[#2C2C54] pr-10"
                                        placeholder={t('vendorSignup.confirmPasswordPlaceholder') as string}
                                    />
                                    <button type="button" className="absolute top-1/2 right-3 -translate-y-1/2 text-[#2C2C54]" tabIndex={-1} onClick={() => setShowConfirmPassword(v => !v)}>
                                        {showConfirmPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                                    </button>
                                </div>
                                {errors.confirmPassword && <span className="text-xs text-red-500 mt-1">{errors.confirmPassword}</span>}
                            </div>

                            {/* Vendor Details Section */}
                            <div className="md:col-span-2">
                                <h3 className="text-xl font-bold text-[#2C2C54] mb-4 border-t pt-6 mt-6">{t('vendorSignup.vendorDetails')}</h3>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <div>
                                        <label className="block font-bold mb-1 text-[#2C2C54]">{t('vendorSignup.ownerName')}</label>
                                        <input type="text" name="owner_name" value={form.owner_name} onChange={handleChange} className="w-full border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-[#2C2C54]" placeholder={t('vendorSignup.ownerNamePlaceholder')} />
                                        {errors.owner_name && <span className="text-xs text-red-500 mt-1">{errors.owner_name}</span>}
                                    </div>
                                    <div>
                                        <label className="block font-bold mb-1 text-[#2C2C54]">{t('vendorSignup.identityNumber')}</label>
                                        <input type="text" name="identity_number" value={form.identity_number} onChange={handleChange} className="w-full border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-[#2C2C54]" placeholder={t('vendorSignup.identityNumberPlaceholder')} />
                                        {errors.identity_number && <span className="text-xs text-red-500 mt-1">{errors.identity_number}</span>}
                                    </div>
                                    <div>
                                        <label className="block font-bold mb-1 text-[#2C2C54]">{t('vendorSignup.taxNumber')}</label>
                                        <input type="text" name="tax_number" value={form.tax_number} onChange={handleChange} className="w-full border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-[#2C2C54]" placeholder={t('vendorSignup.taxNumberPlaceholder')} />
                                        {errors.tax_number && <span className="text-xs text-red-500 mt-1">{errors.tax_number}</span>}
                                    </div>
                                    <div>
                                        <label className="block font-bold mb-1 text-[#2C2C54]">{t('vendorSignup.commercialRegNumber')}</label>
                                        <input type="text" name="commercial_registration_number" value={form.commercial_registration_number} onChange={handleChange} className="w-full border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-[#2C2C54]" placeholder={t('vendorSignup.commercialRegNumberPlaceholder')} />
                                        {errors.commercial_registration_number && <span className="text-xs text-red-500 mt-1">{errors.commercial_registration_number}</span>}
                                    </div>
                                </div>
                            </div>
                            {/* Document Uploads Section */}
                            <div className="md:col-span-2">
                                <h3 className="text-xl font-bold text-[#2C2C54] mb-4 border-t pt-6 mt-6">{t('vendorSignup.documentUploads')}</h3>
                                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                                    <FileUpload name="identity_doc" label={t('vendorSignup.identity_doc')} onChange={handleChange} error={errors.identity_doc} t={t} file={form.identity_doc} />
                                    <FileUpload name="signature_authorization_doc" label={t('vendorSignup.signature_authorization_doc')} onChange={handleChange} error={errors.signature_authorization_doc} t={t} file={form.signature_authorization_doc} />
                                    <FileUpload name="commercial_registration_doc" label={t('vendorSignup.commercial_registration_doc')} onChange={handleChange} error={errors.commercial_registration_doc} t={t} file={form.commercial_registration_doc} />
                                    <FileUpload name="tax_registration_doc" label={t('vendorSignup.tax_registration_doc')} onChange={handleChange} error={errors.tax_registration_doc} t={t} file={form.tax_registration_doc} />
                                    <FileUpload name="lease_or_ownership_doc" label={t('vendorSignup.lease_or_ownership_doc')} onChange={handleChange} error={errors.lease_or_ownership_doc} t={t} file={form.lease_or_ownership_doc} />
                                    <FileUpload name="special_license_doc" label={t('vendorSignup.special_license_doc')} onChange={handleChange} error={errors.special_license_doc} t={t} file={form.special_license_doc} />
                                    <div className="mt-2 text-sm text-gray-600 space-y-1">
                                        <p dangerouslySetInnerHTML={{ __html: t('vendorSignup.license_notes') }} />
                                    </div>

                                </div>
                            </div>
                        </div>

                        <button type="submit" className="mt-8 w-full max-w-md py-3 rounded-xl text-lg font-bold bg-[#2C2C54] text-white shadow hover:bg-[#474787] transition-all duration-300 transform hover:scale-105 font-tajawal animate-scale-in delay-300">
                            {t('common.next') as string || 'التالي'}
                        </button>
                    </form>
                )}
                {/* Stage 1: Terms/Contract */}
                {stage === 1 && (
                    <div className="w-full max-w-xl bg-white rounded-xl shadow-lg p-8 flex flex-col items-center animate-fade-in-up transition-all duration-700 relative">
                        {/* Back Arrow */}
                        <button
                            type="button"
                            onClick={() => setStage(0)}
                            className={`absolute top-4 ${isRTL ? 'left-4' : 'right-4'} flex items-center gap-1 text-[#2C2C54] hover:text-[#474787] font-bold`}
                            aria-label={t('common.back') as string}
                        >
                            {isRTL ? <ArrowRight size={22} /> : <ArrowLeft size={22} />}
                            <span className="hidden md:inline">{t('common.back') as string}</span>
                        </button>
                        <h2 className="text-xl font-bold text-[#2C2C54] mb-4 text-center">
                            {t('vendorSignup.termsTitle') as string}
                        </h2>

                        <div className="w-full border-t border-b border-gray-300 my-4 py-4 text-[#2C2C54] font-tajawal text-base leading-relaxed">
                            {(t('vendorSignup.termsText') as string)
                                .split("\n")
                                .map((line, idx) => (
                                    <p key={idx} className="mb-2 text-center">
                                        {line}
                                    </p>
                                ))}
                        </div>

                        <button className="mt-6 px-8 py-2 rounded-xl text-base font-bold bg-[#2C2C54] text-white shadow hover:bg-[#474787] transition-all duration-300 animate-scale-in" type="button" onClick={() => setStage(2)}>
                            {t('vendorSignup.termsButton') as string}
                        </button>
                    </div>
                )}
                {/* Stage 2: Packages Selection */}
                {stage === 2 && (
                    <div className="w-full max-w-5xl mx-auto flex flex-col items-center animate-fade-in-up transition-all duration-700 relative">
                        {/* Back Arrow */}
                        <button
                            type="button"
                            onClick={() => setStage(1)}
                            className={`absolute top-4 ${isRTL ? 'left-4' : 'right-4'} flex items-center gap-1 text-[#2C2C54] hover:text-[#474787] font-bold`}
                            aria-label={t('common.back') as string}
                        >
                            {isRTL ? <ArrowRight size={22} /> : <ArrowLeft size={22} />}
                            <span className="hidden md:inline">{t('common.back') as string}</span>
                        </button>
                        <h2 className="text-3xl md:text-4xl font-extrabold text-[#2C2C54] mb-2 text-center">{t('vendorSignup.packagesTitle') as string}</h2>
                        <p className="text-lg md:text-xl text-[#2C2C54] font-bold text-center mb-8 max-w-4xl font-tajawal animate-fade-in">{t('vendorSignup.packagesSubtitle') as string}</p>
                        {loadingPackages && <div className="text-[#2C2C54] font-bold mb-8">{t('common.loading') as string || 'جاري التحميل...'}</div>}
                        {packagesError && <div className="text-red-500 font-bold mb-8">{packagesError}</div>}
                        <div className="w-full flex flex-col md:flex-row gap-6 justify-center items-stretch mb-8">
                            {packages.map((pkg) => {
                                const name = isRTL ? pkg.name_ar : pkg.name_en;
                                const description = isRTL ? pkg.description_ar : pkg.description_en;
                                const features = isRTL ? JSON.parse(pkg.features_ar || '[]') : JSON.parse(pkg.features_en || '[]');
                                const isSelected = selectedPackageId === pkg.package_id;
                                return (
                                    <div
                                        key={pkg.package_id}
                                        className={`flex-1 bg-[#2C2C54] rounded-2xl shadow-lg p-6 flex flex-col items-center min-w-[220px] max-w-xs transition-all duration-300 transform animate-fade-in-up cursor-pointer ${isSelected ? 'ring-4 ring-[#F8C291] scale-105' : 'hover:scale-105 hover:ring-2 hover:ring-[#F8C291]'}`}
                                        onClick={() => setSelectedPackageId(pkg.package_id)}
                                        tabIndex={0}
                                        role="button"
                                        aria-pressed={isSelected}
                                    >
                                        <input
                                            type="radio"
                                            name="selectedPackage"
                                            checked={isSelected}
                                            onChange={() => setSelectedPackageId(pkg.package_id)}
                                            className="mb-2 accent-[#F8C291] w-5 h-5 border-2 border-[#F8C291] focus:ring-2 focus:ring-[#F8C291]"
                                            style={{ display: 'block' }}
                                        />
                                        <h3 className="text-2xl font-extrabold text-white mb-2">{name}</h3>
                                        <div className="flex items-baseline gap-2 mb-2">
                                            <span className="text-3xl font-extrabold text-white">${pkg.price}</span>
                                            <span className="text-base font-bold text-white">{t('vendorSignup.packages.perMonth') as string}</span>
                                        </div>
                                        <ul className="text-white text-right w-full mb-4 flex-1">
                                            {features.map((f: string, i: number) => (
                                                <li key={i} className="flex items-center gap-2 mb-1">
                                                    <svg width="18" height="18" fill="none" viewBox="0 0 24 24" stroke="currentColor" className="text-green-400"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M5 13l4 4L19 7" /></svg>
                                                    <span>{f}</span>
                                                </li>
                                            ))}
                                        </ul>
                                        <span className="text-sm text-white mb-2">{description}</span>
                                        <button
                                            type="button"
                                            className={`mt-2 px-6 py-2 rounded-lg text-base font-bold shadow transition-all duration-300 animate-scale-in w-full ${isSelected ? 'bg-[#F8C291] text-[#2C2C54]' : 'bg-white text-[#2C2C54] hover:bg-[#F8C291] hover:text-[#2C2C54]'}`}
                                            onClick={() => setSelectedPackageId(pkg.package_id)}
                                        >
                                            {isSelected ? t('vendorSignup.packages.subscribeNow') as string : t('vendorSignup.packages.subscribeNow') as string}
                                        </button>
                                    </div>
                                );
                            })}
                        </div>
                        {/* Add duration and product count selection only for real estate vendor type */}
                        {form.vendorType === 'real_estate' && (
                            <>
                                <div className="flex flex-col md:flex-row gap-4 items-center mb-4">
                                    <label className="font-bold text-[#2C2C54]">مدة الاشتراك:</label>
                                    <button
                                        type="button"
                                        className={`px-4 py-2 rounded-lg font-bold border-2 ${selectedDuration === 14 ? 'bg-[#F8C291] border-[#F8C291] text-[#2C2C54]' : 'bg-white border-gray-300 text-[#2C2C54]'}`}
                                        onClick={() => setSelectedDuration(14)}
                                    >
                                        أسبوعان (2 Weeks)
                                    </button>
                                    <button
                                        type="button"
                                        className={`px-4 py-2 rounded-lg font-bold border-2 ${selectedDuration === 30 ? 'bg-[#F8C291] border-[#F8C291] text-[#2C2C54]' : 'bg-white border-gray-300 text-[#2C2C54]'}`}
                                        onClick={() => setSelectedDuration(30)}
                                    >
                                        شهر (1 Month)
                                    </button>
                                </div>
                                <div className="flex flex-col md:flex-row gap-4 items-center mb-4">
                                    <label className="font-bold text-[#2C2C54]">عدد العقارات/المنتجات:</label>
                                    <input
                                        type="number"
                                        min={1}
                                        value={numProducts}
                                        onChange={e => setNumProducts(Number(e.target.value))}
                                        className="w-24 border rounded px-3 py-2 border-gray-300 text-center font-bold"
                                    />
                                </div>
                            </>
                        )}
                        {/* Subscribe button (simulate API call) */}
                        <button
                            className={`mt-4 px-12 py-3 rounded-xl text-lg font-bold bg-[#2C2C54] text-white shadow hover:bg-[#474787] transition-all duration-300 animate-scale-in ${selectedPackageId ? '' : 'opacity-50 cursor-not-allowed'}`}
                            style={{ minWidth: '260px' }}
                            disabled={!selectedPackageId}
                            onClick={handleSubmit}
                        >
                            {t('vendorSignup.packages.subscribeNow') as string}
                        </button>
                    </div>
                )}
                {/* Stage 3: Account Under Review */}
                {stage === 3 && (
                    <div className="w-full max-w-xl bg-white rounded-xl shadow-lg p-8 flex flex-col items-center animate-fade-in-up transition-all duration-700 relative">
                        <h2 className="text-xl font-bold text-[#2C2C54] mb-4 text-center">{t('vendorSignup.reviewTitle') as string}</h2>
                        <p className="text-center text-lg text-[#2C2C54]">
                            {t('vendorSignup.accountUnderReview') as string || 'حسابك قيد المراجعة وسيتواصل معك أحدهم قريبًا ليخبرك كيفية الدفع.'}
                        </p>
                    </div>
                )}
            </main>
            <Footer />
            <style jsx>{`
                .loader {
                    border: 4px solid #f3f3f3;
                    border-top: 4px solid #2C2C54;
                    border-radius: 50%;
                    width: 28px;
                    height: 28px;
                    animation: spin 1s linear infinite;
                }
                @keyframes spin {
                    0% { transform: rotate(0deg); }
                    100% { transform: rotate(360deg); }
                }
            `}</style>
        </div>
    );
}