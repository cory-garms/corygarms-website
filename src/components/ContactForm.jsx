import React, { useState } from 'react';

export default function ContactForm() {
    const [status, setStatus] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setIsSubmitting(true);
        setStatus('');
        
        const form = e.target;
        const formData = new FormData(form);

        // Required Web3Forms generic access key. 
        // Note: The user should replace this or pass it in via ENV in a real production repo.
        formData.append("access_key", import.meta.env.PUBLIC_WEB3FORMS_ACCESS_KEY);
        formData.append("subject", "New Contact from corygarms.com");

        try {
            const response = await fetch("https://api.web3forms.com/submit", {
                method: "POST",
                body: formData
            });

            const data = await response.json();

            if (data.success) {
                setStatus('success');
                form.reset();
            } else {
                console.log("Error", data);
                setStatus('error');
            }
        } catch (error) {
            console.error(error);
            setStatus('error');
        } finally {
            setIsSubmitting(false);
        }
    };

    if (status === 'success') {
        return (
            <div className="p-8 bg-green-900/20 border border-green-500/50 rounded-xl text-center shadow-lg">
                <div className="text-4xl mb-4">✅</div>
                <h3 className="text-xl font-bold text-green-100 mb-2">Message Sent!</h3>
                <p className="text-green-200/80 font-mono text-sm">Thank you for reaching out. I'll get back to you as soon as possible.</p>
                <button onClick={() => setStatus('')} className="mt-6 text-sm underline text-green-400 hover:text-green-300">
                    Send another message
                </button>
            </div>
        );
    }

    return (
        <form onSubmit={handleSubmit} className="flex flex-col gap-6" id="contact-form">
            <input type="hidden" name="from_name" value="corygarms.com Contact Form" />
            <input type="checkbox" name="botcheck" className="hidden" style={{ display: 'none' }} />

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                <div className="flex flex-col gap-2">
                    <label htmlFor="name" className="text-xs font-mono text-text-muted uppercase tracking-wider">Name</label>
                    <input 
                        type="text" 
                        id="name" 
                        name="name" 
                        required 
                        className="w-full bg-forest-950 border border-border rounded-lg px-4 py-3 text-white focus:outline-none focus:border-accent focus:ring-1 focus:ring-accent transition-all placeholder:text-text-dim text-sm"
                        placeholder="Dr. Jane Doe"
                    />
                </div>
                <div className="flex flex-col gap-2">
                    <label htmlFor="email" className="text-xs font-mono text-text-muted uppercase tracking-wider">Email</label>
                    <input 
                        type="email" 
                        id="email" 
                        name="email" 
                        required 
                        className="w-full bg-forest-950 border border-border rounded-lg px-4 py-3 text-white focus:outline-none focus:border-accent focus:ring-1 focus:ring-accent transition-all placeholder:text-text-dim text-sm"
                        placeholder="scientist@institution.org"
                    />
                </div>
            </div>

            <div className="flex flex-col gap-2">
                <label htmlFor="message" className="text-xs font-mono text-text-muted uppercase tracking-wider">Message</label>
                <textarea 
                    id="message" 
                    name="message" 
                    required 
                    rows={5}
                    className="w-full bg-forest-950 border border-border rounded-lg px-4 py-3 text-white focus:outline-none focus:border-accent focus:ring-1 focus:ring-accent transition-all placeholder:text-text-dim text-sm resize-y"
                    placeholder="Hello Dr. Garms, reaching out regarding 3D point cloud workflows or potential research collaboration..."
                />
            </div>

            <button 
                type="submit" 
                disabled={isSubmitting}
                className="self-start px-7 py-3 bg-accent hover:bg-accent-light text-forest-950 font-semibold text-sm rounded-lg transition-all shadow-sm hover:shadow-[0_0_20px_rgba(16,185,129,0.3)] disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center min-w-[160px] cursor-pointer"
            >
                {isSubmitting ? (
                    <span className="w-5 h-5 border-2 border-forest-950/30 border-t-forest-950 rounded-full animate-spin"></span>
                ) : (
                    "Send Message"
                )}
            </button>

            {status === 'error' && (
                <div className="p-4 bg-red-950/30 border border-red-500/40 rounded-lg text-red-200 text-xs font-mono mt-2">
                    ⚠️ Something went wrong transmitting your message. Please try again or reach out directly at coryglenngarms@gmail.com.
                </div>
            )}
            
            <p className="text-[11px] font-mono text-text-dim mt-2">
                Transmitted securely via Web3Forms endpoint to coryglenngarms@gmail.com.
            </p>
        </form>
    );
}
