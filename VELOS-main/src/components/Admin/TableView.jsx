import React, { useContext } from 'react'
import { AppDataContext } from '../../context/AppDataContext'
import { AlertTriangle, Clock, Navigation } from 'lucide-react'

const TableView = () => {
  const { shipments, sendOverride, t } = useContext(AppDataContext)

  const incoming = shipments.filter(s => s.type === 'Incoming')
  const outgoing = shipments.filter(s => s.type === 'Outgoing')

  const getStatusColor = (status) => {
    switch (status) {
      case 'Moving': return 'var(--status-green)';
      case 'Resting': return 'var(--accent-primary)';
      case 'Rerouting': return 'var(--status-yellow)';
      case 'EMERGENCY': return 'var(--status-red)';
      default: return 'var(--text-muted)';
    }
  }

  const renderTable = (data, title) => (
    <div className="flex-col p-4 w-full" style={{ flex: 1, borderRight: '1px solid var(--border-light)' }}>
      <h2 style={{ marginBottom: '16px', color: 'var(--text-muted)' }}>{title} ({data.length})</h2>
      <div className="flex-col gap-4">
        {data.map(shipment => {
          const isDelayed = shipment.delayedPct > 15;
          return (
            <div key={shipment.id} className={`glass-panel p-4 flex-col gap-2 ${shipment.status === 'EMERGENCY' ? 'animate-pulse-red' : ''}`} style={{ borderColor: isDelayed ? 'var(--status-yellow)' : 'var(--border-light)' }}>
              <div className="flex-row justify-between items-center">
                <h3 style={{ margin: 0 }}>{shipment.id} - {shipment.driverName}</h3>
                <span style={{ color: getStatusColor(shipment.status), fontWeight: 'bold' }}>{shipment.status}</span>
              </div>
              
              <div className="text-muted" style={{ fontSize: '0.9rem' }}>
                {shipment.origin} <Navigation size={12} style={{ display: 'inline', margin: '0 4px' }} /> {shipment.destination}
              </div>

              <div className="flex-row justify-between items-center" style={{ marginTop: '8px', fontSize: '0.85rem' }}>
                <span className="flex-row items-center gap-2"><Clock size={14}/> {shipment.timeElapsed} / {shipment.etaOriginal}</span>
                <span style={{ color: shipment.weather.comfortScore < 5 ? 'var(--status-red)' : 'var(--status-green)' }}>
                  Comfort: {shipment.weather.comfortScore}/10 
                </span>
              </div>

              {shipment.alerts.length > 0 && (
                <div style={{ marginTop: '8px', padding: '8px', background: 'rgba(245, 158, 11, 0.1)', borderLeft: '3px solid var(--status-yellow)', fontSize: '0.85rem' }}>
                  <AlertTriangle size={14} style={{ display: 'inline', marginRight: '4px', verticalAlign: 'middle' }} color="var(--status-yellow)" />
                  {shipment.alerts.join(', ')}
                </div>
              )}

              {/* Action Buttons */}
              <div className="flex-row justify-end gap-2" style={{ marginTop: '12px' }}>
                <button className="btn" style={{ fontSize: '0.8rem', padding: '6px 12px' }} onClick={() => {
                  const reason = prompt(t('OVERRIDE_PROMPT', "Enter override reason (e.g. 'Heavy storm ahead'):"));
                  if (reason) sendOverride(shipment.id, reason);
                }}>
                  {t('SUGGEST_OVERRIDE', 'Suggest Route Change')}
                </button>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )

  return (
    <div className="flex-row w-full h-full" style={{ overflowY: 'auto' }}>
      {renderTable(incoming, t('INCOMING_SHIPMENTS', "Incoming Shipments"))}
      {renderTable(outgoing, t('OUTGOING_SHIPMENTS', "Outgoing Shipments"))}
    </div>
  )
}

export default TableView
