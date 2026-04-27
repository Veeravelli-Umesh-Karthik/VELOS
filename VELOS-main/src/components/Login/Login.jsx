import React, { useContext, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Activity, Shield, Truck, CloudRain, BrainCircuit, Globe, ChevronRight, AlertTriangle, ArrowRight } from 'lucide-react'
import { AppDataContext } from '../../context/AppDataContext'

const Login = () => {
  const navigate = useNavigate()
  const { shipments, language, setLanguage, t } = useContext(AppDataContext)
  const [showTransitSelect, setShowTransitSelect] = useState(false)
  const [showLangDropdown, setShowLangDropdown] = useState(false)
  const languages = ['EN', 'ES', 'FR', 'DE', 'IT', 'PT', 'ZH', 'JA', 'HI', 'AR']

  const handleDriverLogin = (driverId) => {
    navigate(`/driver/${driverId}`)
  }

  return (
    <div style={{ position: 'relative', width: '100vw', minHeight: '100vh', overflowX: 'hidden', overflowY: 'auto', backgroundColor: '#09090b', color: '#fff' }}>
      
      {/* Background Image with Cinematic Dark Overlay */}
      <div style={{ position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh', zIndex: 0 }}>
        <img 
          src="https://images.unsplash.com/photo-1519003722824-194d4455a60c?q=80&w=2075&auto=format&fit=crop" 
          alt="Cinematic Highway" 
          style={{ width: '100%', height: '100%', objectFit: 'cover', opacity: 0.4 }} 
        />
        <div style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', background: 'linear-gradient(90deg, rgba(9,9,11,1) 0%, rgba(9,9,11,0.6) 40%, rgba(9,9,11,0) 100%)' }} />
        <div style={{ position: 'absolute', top: 0, right: 0, width: '40%', height: '100%', background: 'linear-gradient(270deg, rgba(9,9,11,1) 0%, rgba(9,9,11,0) 100%)' }} />
      </div>

      {/* Main Grid Overlay */}
      <div style={{ position: 'relative', width: '100%', minHeight: '100vh', zIndex: 10, display: 'flex', flexDirection: 'column' }}>
        
        {/* Top Header */}
        <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '32px 48px' }}>
          <div className="flex-row items-center gap-3">
             <Activity color="#3b82f6" size={32} />
             <div className="flex-col">
               <strong style={{ fontSize: '1.5rem', letterSpacing: '1px', fontWeight: 800, lineHeight: 1 }}>V.E.L.O.S.</strong>
               <span style={{ fontSize: '0.65rem', color: '#a1a1aa', letterSpacing: '2px', textTransform: 'uppercase', marginTop: '4px' }}>
                 Versatile • Efficient • Logistics • Optimized • Safety
               </span>
             </div>
          </div>
          
          <div className="flex-row items-center gap-4">
             <div className="glass-panel flex-row items-center gap-2" style={{ padding: '8px 16px', borderRadius: '50px', background: 'rgba(24,24,27,0.6)', border: '1px solid rgba(255,255,255,0.1)' }}>
                <div style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: '#10b981', boxShadow: '0 0 10px #10b981' }} />
                <span style={{ fontSize: '0.85rem', color: '#a1a1aa' }}>{t('SYSTEM_STATUS')} <span style={{ color: '#fff' }}>{t('OPERATIONAL')}</span></span>
                <ChevronRight size={14} color="#a1a1aa" />
             </div>
             
             {/* Language Dropdown */}
             <div style={{ position: 'relative' }}>
               <div 
                  onClick={() => setShowLangDropdown(!showLangDropdown)}
                  className="glass-panel flex-row items-center gap-2" 
                  style={{ padding: '8px 16px', borderRadius: '50px', background: 'rgba(24,24,27,0.6)', border: '1px solid rgba(255,255,255,0.1)', cursor: 'pointer', transition: 'all 0.2s', userSelect: 'none' }}
                  onMouseOver={(e) => e.currentTarget.style.background = 'rgba(255,255,255,0.1)'}
                  onMouseOut={(e) => e.currentTarget.style.background = 'rgba(24,24,27,0.6)'}
               >
                  <Globe size={16} color="#a1a1aa" />
                  <span style={{ fontSize: '0.85rem', color: '#fff', width: '20px', textAlign: 'center' }}>{language}</span>
               </div>
               
               {showLangDropdown && (
                 <div className="glass-panel" style={{ position: 'absolute', top: '100%', right: 0, marginTop: '8px', padding: '8px', borderRadius: '12px', background: 'rgba(24,24,27,0.9)', backdropFilter: 'blur(20px)', border: '1px solid rgba(255,255,255,0.1)', display: 'flex', flexDirection: 'column', gap: '4px', zIndex: 50, minWidth: '80px' }}>
                   {languages.map(lang => (
                     <button
                       key={lang}
                       onClick={() => { setLanguage(lang); setShowLangDropdown(false); }}
                       style={{ background: language === lang ? 'rgba(59,130,246,0.2)' : 'transparent', border: 'none', color: '#fff', padding: '8px 12px', borderRadius: '8px', cursor: 'pointer', textAlign: 'left', fontSize: '0.85rem' }}
                       onMouseOver={(e) => { if(language !== lang) e.currentTarget.style.background = 'rgba(255,255,255,0.1)' }}
                       onMouseOut={(e) => { if(language !== lang) e.currentTarget.style.background = 'transparent' }}
                     >
                       {lang}
                     </button>
                   ))}
                 </div>
               )}
             </div>

          </div>
        </header>

        {/* Center Content Row */}
        <main style={{ flex: 1, display: 'flex', flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: '0 48px', paddingBottom: '48px' }}>
          
          {/* Left Hero & Action Area */}
          <div className="flex-col" style={{ flex: 1, maxWidth: '650px', gap: '32px' }}>
            
            {/* Hero Text */}
            <div className="flex-col">
              <h1 style={{ fontSize: '4.5rem', fontWeight: 800, lineHeight: 1.1, letterSpacing: '-1px', margin: 0 }}>
                {t('LOGISTICS_REIMAGINED')}<br/>
                <span style={{ color: '#3b82f6' }}>{t('REIMAGINED')}</span>
              </h1>
              <p style={{ fontSize: '1.2rem', color: '#a1a1aa', marginTop: '24px', lineHeight: 1.6, maxWidth: '500px' }}>
                {t('HERO_SUBTEXT')}
              </p>
            </div>

            {/* Stats Row */}
            <div className="glass-panel" style={{ display: 'flex', flexDirection: 'row', justifyContent: 'space-between', padding: '24px', borderRadius: '16px', background: 'rgba(24,24,27,0.4)', border: '1px solid rgba(255,255,255,0.05)' }}>
               <div className="flex-col items-center gap-2" style={{ flex: 1 }}>
                  <Truck size={20} color="#a1a1aa" />
                  <strong style={{ fontSize: '1.2rem' }}>12.4K+</strong>
                  <span style={{ fontSize: '0.75rem', color: '#a1a1aa', textAlign: 'center' }}>{t('ACTIVE_SHIPMENTS')}</span>
               </div>
               <div className="flex-col items-center gap-2" style={{ flex: 1, borderLeft: '1px solid rgba(255,255,255,0.05)' }}>
                  <Shield size={20} color="#a1a1aa" />
                  <strong style={{ fontSize: '1.2rem' }}>98.7%</strong>
                  <span style={{ fontSize: '0.75rem', color: '#a1a1aa', textAlign: 'center' }}>{t('ON_TIME_DELIVERY')}</span>
               </div>
               <div className="flex-col items-center gap-2" style={{ flex: 1, borderLeft: '1px solid rgba(255,255,255,0.05)' }}>
                  <CloudRain size={20} color="#a1a1aa" />
                  <strong style={{ fontSize: '1.2rem' }}>32</strong>
                  <span style={{ fontSize: '0.75rem', color: '#a1a1aa', textAlign: 'center' }}>{t('RISK_ALERTS')}</span>
               </div>
               <div className="flex-col items-center gap-2" style={{ flex: 1, borderLeft: '1px solid rgba(255,255,255,0.05)' }}>
                  <Activity size={20} color="#a1a1aa" />
                  <strong style={{ fontSize: '1.2rem' }}>245K+ km</strong>
                  <span style={{ fontSize: '0.75rem', color: '#a1a1aa', textAlign: 'center' }}>{t('ROUTES_ANALYZED')}</span>
               </div>
            </div>

            {/* Access Cards Row */}
            <div className="flex-col gap-4">
              <h3 style={{ fontSize: '1.1rem', margin: 0 }}>{t('CHOOSE_ACCESS')}</h3>
              
              {!showTransitSelect ? (
                <div className="flex-row gap-4">
                  {/* Admin Card */}
                  <div 
                    onClick={() => navigate('/admin')}
                    style={{ flex: 1, position: 'relative', borderRadius: '16px', overflow: 'hidden', padding: '24px', cursor: 'pointer', border: '1px solid rgba(59,130,246,0.3)', background: 'linear-gradient(135deg, rgba(24,24,27,0.8) 0%, rgba(59,130,246,0.1) 100%)', backdropFilter: 'blur(10px)' }}
                  >
                     <div className="flex-row items-center justify-between" style={{ marginBottom: '16px' }}>
                        <div style={{ padding: '12px', background: 'rgba(59,130,246,0.15)', borderRadius: '12px' }}>
                           <Shield size={24} color="#3b82f6" />
                        </div>
                        <div style={{ padding: '8px', background: 'rgba(255,255,255,0.05)', borderRadius: '50%' }}>
                           <ArrowRight size={16} color="#fff" />
                        </div>
                     </div>
                     <strong style={{ fontSize: '1.2rem', display: 'block', marginBottom: '4px' }}>{t('ADMIN_CONSOLE')}</strong>
                     <span style={{ fontSize: '0.85rem', color: '#a1a1aa' }}>{t('ADMIN_DESC')}</span>
                  </div>

                  {/* Driver Card */}
                  <div 
                    onClick={() => setShowTransitSelect(true)}
                    style={{ flex: 1, position: 'relative', borderRadius: '16px', overflow: 'hidden', padding: '24px', cursor: 'pointer', border: '1px solid rgba(16,185,129,0.3)', background: 'linear-gradient(135deg, rgba(24,24,27,0.8) 0%, rgba(16,185,129,0.1) 100%)', backdropFilter: 'blur(10px)' }}
                  >
                     <div className="flex-row items-center justify-between" style={{ marginBottom: '16px' }}>
                        <div style={{ padding: '12px', background: 'rgba(16,185,129,0.15)', borderRadius: '12px' }}>
                           <Truck size={24} color="#10b981" />
                        </div>
                        <div style={{ padding: '8px', background: 'rgba(255,255,255,0.05)', borderRadius: '50%' }}>
                           <ArrowRight size={16} color="#fff" />
                        </div>
                     </div>
                     <strong style={{ fontSize: '1.2rem', display: 'block', marginBottom: '4px' }}>{t('DRIVER_COCKPIT')}</strong>
                     <span style={{ fontSize: '0.85rem', color: '#a1a1aa' }}>{t('DRIVER_DESC')}</span>
                  </div>
                </div>
              ) : (
                <div className="glass-panel p-4 flex-col" style={{ borderRadius: '16px', background: 'rgba(24,24,27,0.6)', border: '1px solid rgba(16,185,129,0.3)' }}>
                  <div className="flex-row justify-between items-center" style={{ marginBottom: '16px' }}>
                    <h4 style={{ margin: 0, color: '#fff' }}>{t('SELECT_TRANSIT')}</h4>
                    <button className="btn" style={{ padding: '4px 12px', fontSize: '0.8rem', background: 'transparent' }} onClick={() => setShowTransitSelect(false)}>{t('BACK')}</button>
                  </div>
                  <div className="flex-col gap-2" style={{ maxHeight: '200px', overflowY: 'auto' }}>
                    {shipments.map(s => (
                      <button
                        key={s.id}
                        className="flex-row items-center justify-between"
                        style={{ padding: '16px', background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.05)', borderRadius: '12px', cursor: 'pointer', transition: 'all 0.2s', color: '#fff' }}
                        onClick={() => handleDriverLogin(s.id)}
                        onMouseOver={(e) => { e.currentTarget.style.borderColor = '#10b981'; e.currentTarget.style.background = 'rgba(16,185,129,0.1)' }}
                        onMouseOut={(e) => { e.currentTarget.style.borderColor = 'rgba(255,255,255,0.05)'; e.currentTarget.style.background = 'rgba(255,255,255,0.03)' }}
                      >
                        <div className="flex-col" style={{ textAlign: 'left' }}>
                          <strong style={{ fontSize: '1rem' }}>{s.id} - {s.driverName}</strong>
                          <span style={{ fontSize: '0.8rem', color: '#a1a1aa' }}>{s.origin} ➔ {s.destination}</span>
                        </div>
                        <Truck size={20} color="#10b981" />
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>

          </div>

          {/* Right Intelligence Panel */}
          <div className="glass-panel flex-col" style={{ width: '420px', borderRadius: '24px', background: 'rgba(9,9,11,0.6)', backdropFilter: 'blur(20px)', border: '1px solid rgba(255,255,255,0.1)', padding: '32px' }}>
             
             <div className="flex-col" style={{ marginBottom: '32px' }}>
                <strong style={{ fontSize: '1.2rem', marginBottom: '4px' }}>{t('INTEL_DRIVES')}</strong>
                <span style={{ fontSize: '1.2rem', color: '#3b82f6', fontWeight: 700 }}>{t('EVERY_DECISION')}</span>
                <div style={{ width: '40px', height: '2px', background: '#3b82f6', marginTop: '16px' }} />
             </div>

             <div className="flex-col gap-6">
                
                <div className="flex-row items-start gap-4">
                   <div style={{ padding: '14px', background: 'rgba(59,130,246,0.15)', borderRadius: '16px', color: '#3b82f6', marginTop: '4px' }}>
                      <Activity size={24} />
                   </div>
                   <div className="flex-col">
                      <strong style={{ fontSize: '1.05rem', marginBottom: '4px' }}>{t('REALTIME_ROUTING')}</strong>
                      <span style={{ fontSize: '0.85rem', color: '#a1a1aa', lineHeight: 1.5 }}>{t('ROUTING_DESC')}</span>
                   </div>
                </div>

                <div className="flex-row items-start gap-4">
                   <div style={{ padding: '14px', background: 'rgba(16,185,129,0.15)', borderRadius: '16px', color: '#10b981', marginTop: '4px' }}>
                      <CloudRain size={24} />
                   </div>
                   <div className="flex-col">
                      <strong style={{ fontSize: '1.05rem', marginBottom: '4px' }}>{t('WEATHER_RADAR')}</strong>
                      <span style={{ fontSize: '0.85rem', color: '#a1a1aa', lineHeight: 1.5 }}>{t('WEATHER_DESC')}</span>
                   </div>
                </div>

                <div className="flex-row items-start gap-4">
                   <div style={{ padding: '14px', background: 'rgba(245,158,11,0.15)', borderRadius: '16px', color: '#f59e0b', marginTop: '4px' }}>
                      <BrainCircuit size={24} />
                   </div>
                   <div className="flex-col">
                      <strong style={{ fontSize: '1.05rem', marginBottom: '4px' }}>{t('BIOMETRIC_FATIGUE')}</strong>
                      <span style={{ fontSize: '0.85rem', color: '#a1a1aa', lineHeight: 1.5 }}>{t('FATIGUE_DESC')}</span>
                   </div>
                </div>

                <div className="flex-row items-start gap-4">
                   <div style={{ padding: '14px', background: 'rgba(239,68,68,0.15)', borderRadius: '16px', color: '#ef4444', marginTop: '4px' }}>
                      <AlertTriangle size={24} />
                   </div>
                   <div className="flex-col">
                      <strong style={{ fontSize: '1.05rem', marginBottom: '4px' }}>{t('SMART_ALERTS')}</strong>
                      <span style={{ fontSize: '0.85rem', color: '#a1a1aa', lineHeight: 1.5 }}>{t('ALERTS_DESC')}</span>
                   </div>
                </div>

             </div>
          </div>
        </main>

        {/* Footer */}
        <footer style={{ display: 'flex', justifyContent: 'space-between', padding: '24px 48px', borderTop: '1px solid rgba(255,255,255,0.05)', backgroundColor: 'rgba(9,9,11,0.4)', backdropFilter: 'blur(10px)' }}>
           <div className="flex-row items-center gap-2">
              <Shield size={16} color="#3b82f6" />
              <span style={{ fontSize: '0.85rem', color: '#4b5563' }}>{t('SECURED')}</span>
           </div>
           <div>
              <span style={{ fontSize: '0.9rem', color: '#71717a' }}>{t('FOOTER_QUOTE')}</span>
           </div>
           <div>
              <span style={{ fontSize: '0.85rem', color: '#4b5563' }} dangerouslySetInnerHTML={{ __html: t('BUILT_FOR_ROAD') }}></span>
           </div>
        </footer>

      </div>
    </div>
  )
}

export default Login
