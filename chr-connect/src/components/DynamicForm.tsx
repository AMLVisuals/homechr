'use client';

import { useState, useEffect } from 'react';
import { FormField } from '@/config/missions';
import { clsx } from 'clsx';
import { motion, AnimatePresence } from 'framer-motion';

interface DynamicFormProps {
  fields: FormField[];
  onChange: (values: Record<string, any>) => void;
}

export default function DynamicForm({ fields, onChange }: DynamicFormProps) {
  const [values, setValues] = useState<Record<string, any>>({});

  const handleChange = (id: string, value: any) => {
    const newValues = { ...values, [id]: value };
    setValues(newValues);
    onChange(newValues);
  };

  return (
    <div className="space-y-4">
      {fields.map((field) => (
        <div key={field.id} className="space-y-2">
          <label className="block text-sm font-medium text-gray-400">
            {field.label} {field.required && <span className="text-red-500">*</span>}
          </label>

          {/* TEXT / NUMBER / DATE */}
          {(field.type === 'text' || field.type === 'number' || field.type === 'date') && (
            <div className="relative">
              <input
                type={field.type}
                placeholder={field.placeholder}
                value={values[field.id] || ''}
                onChange={(e) => handleChange(field.id, field.type === 'number' ? parseFloat(e.target.value) : e.target.value)}
                className="w-full bg-black/20 border border-white/10 rounded-xl px-4 py-3 text-white placeholder-gray-600 focus:ring-1 focus:ring-blue-500 outline-none transition-all"
              />
              {field.suffix && (
                <span className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-500 text-sm">
                  {field.suffix}
                </span>
              )}
            </div>
          )}

          {/* SELECT */}
          {field.type === 'select' && (
            <div className="relative">
              <select
                value={values[field.id] || ''}
                onChange={(e) => handleChange(field.id, e.target.value)}
                className="w-full bg-black/20 border border-white/10 rounded-xl px-4 py-3 text-white placeholder-gray-600 focus:ring-1 focus:ring-blue-500 outline-none appearance-none cursor-pointer"
              >
                <option value="" disabled className="bg-gray-900 text-gray-500">Sélectionner...</option>
                {field.options?.map(opt => (
                  <option key={opt} value={opt} className="bg-gray-900 text-white">{opt}</option>
                ))}
              </select>
              <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-gray-500">
                ▼
              </div>
            </div>
          )}

          {/* RADIO */}
          {field.type === 'radio' && (
            <div className="flex flex-wrap gap-2">
              {field.options?.map(opt => (
                <button
                  key={opt}
                  onClick={() => handleChange(field.id, opt)}
                  className={clsx(
                    "px-4 py-2 rounded-lg text-sm font-medium transition-all border",
                    values[field.id] === opt 
                      ? "bg-blue-500/20 border-blue-500 text-blue-300" 
                      : "bg-white/5 border-transparent text-gray-400 hover:bg-white/10"
                  )}
                >
                  {opt}
                </button>
              ))}
            </div>
          )}

          {/* CHECKBOX */}
          {field.type === 'checkbox' && (
            <label className="flex items-center gap-3 cursor-pointer group">
              <div className={clsx(
                "w-6 h-6 rounded-lg border flex items-center justify-center transition-colors",
                values[field.id] 
                  ? "bg-blue-500 border-blue-500" 
                  : "bg-black/20 border-white/10 group-hover:border-white/30"
              )}>
                {values[field.id] && <span className="text-white font-bold">✓</span>}
              </div>
              <input 
                type="checkbox" 
                className="hidden" 
                checked={values[field.id] || false} 
                onChange={(e) => handleChange(field.id, e.target.checked)}
              />
              <span className={clsx("text-sm transition-colors", values[field.id] ? "text-white" : "text-gray-400")}>
                {field.label}
              </span>
            </label>
          )}

           {/* MULTISELECT */}
           {field.type === 'multiselect' && (
            <div className="flex flex-wrap gap-2">
              {field.options?.map(opt => {
                const selected = (values[field.id] || []).includes(opt);
                return (
                  <button
                    key={opt}
                    onClick={() => {
                      const current = values[field.id] || [];
                      const newValue = selected ? current.filter((v: string) => v !== opt) : [...current, opt];
                      handleChange(field.id, newValue);
                    }}
                    className={clsx(
                      "px-3 py-1.5 rounded-full text-xs font-medium transition-all border",
                      selected
                        ? "bg-white text-black border-white" 
                        : "bg-white/5 border-white/10 text-gray-400 hover:border-white/30"
                    )}
                  >
                    {selected ? '✓ ' : '+ '}{opt}
                  </button>
                );
              })}
            </div>
          )}

          {/* TEXTAREA */}
          {field.type === 'textarea' && (
            <textarea
              placeholder={field.placeholder}
              value={values[field.id] || ''}
              onChange={(e) => handleChange(field.id, e.target.value)}
              className="w-full bg-black/20 border border-white/10 rounded-xl px-4 py-3 text-white placeholder-gray-600 focus:ring-1 focus:ring-blue-500 outline-none transition-all min-h-[100px] resize-none"
            />
          )}

        </div>
      ))}
    </div>
  );
}
