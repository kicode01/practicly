import React, { useState, useMemo, useRef } from 'react';
import { SegmentedControl, Button, MaterialSelect } from './MaterialComponents';
import {
  IconClose,
  IconDownload,
  IconCheckCircle,
  IconAlert,
  IconClock,
  IconShieldCheck,
  IconPrinter,
  IconPlus,
} from './Icons';
import { playClickSound, playSuccessChime, playCelebrationFanfare } from '../utils/soundEffects';
import { launchConfetti } from '../utils/confetti';

export default function DtrTransferModal({
  isOpen,
  onClose,
  placement,
  placements = [],
  currentUser,
  onSuccess,
  timelogs = [],
}) {
  const [activeTab, setActiveTab] = useState(
    currentUser?.role === 'adviser' ? 'audit' : 'proof'
  );
  const [selectedPlacementId, setSelectedPlacementId] = useState(
    placement?.placement_id ? String(placement.placement_id) : placements[0]?.placement_id ? String(placements[0].placement_id) : '1'
  );

  // File import state
  const [csvText, setCsvText] = useState('');
  const [parsedRows, setParsedRows] = useState([]);
  const [fileName, setFileName] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [verificationPushed, setVerificationPushed] = useState(false);
  const fileInputRef = useRef(null);

  // Document proof state (Signed HR DTR)
  const [proofFile, setProofFile] = useState(null);
  const [proofPreviewUrl, setProofPreviewUrl] = useState(null);
  const [signedHoursInput, setSignedHoursInput] = useState('300.00');
  const proofInputRef = useRef(null);

  const activePlacement = useMemo(() => {
    return (
      placements.find((p) => String(p.placement_id) === String(selectedPlacementId)) ||
      placement ||
      placements[0]
    );
  }, [placements, selectedPlacementId, placement]);

  // Synchronize proof state with localStorage for active placement
  React.useEffect(() => {
    if (!activePlacement?.placement_id) return;
    try {
      const saved = localStorage.getItem(`mit_ojt_signed_dtr_proof_${activePlacement.placement_id}`);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed.url) setProofPreviewUrl(parsed.url);
        if (parsed.signedHours) setSignedHoursInput(parsed.signedHours);
        if (parsed.fileName) setProofFile({ name: parsed.fileName });
      }
    } catch {
      // ignore
    }
  }, [activePlacement?.placement_id]);

  // Current database hours for active placement
  const placementLogs = useMemo(() => {
    if (!activePlacement) return [];
    return timelogs.filter((tl) => Number(tl.placement_id) === Number(activePlacement.placement_id));
  }, [timelogs, activePlacement]);

  const databaseHours = useMemo(() => {
    return placementLogs
      .filter((tl) => tl.approval_status !== 'flagged')
      .reduce((sum, tl) => sum + Number(tl.hours_rendered || 0), 0);
  }, [placementLogs]);

  // Download Sample Excel / CSV DTR Template with UTF-8 BOM
  const handleDownloadTemplate = () => {
    playClickSound();
    const headers = 'Date,Time In,Time Out,Break Minutes,Net Hours,Task Description';
    const sampleRows = [
      '2026-11-02,08:00,17:00,60,8.00,"Orientation, workplace safety briefing, and engineering workstation setup"',
      '2026-11-03,08:00,17:00,60,8.00,"Configured developer tools, cloned repository, and reviewed architecture specs"',
      '2026-11-04,08:00,17:00,60,8.00,"Developed database migration scripts and resolved schema normalization warnings"',
      '2026-11-05,08:00,17:00,60,8.00,"Integrated API endpoints with frontend state management and performed unit testing"',
      '2026-11-06,08:00,17:00,60,8.00,"Sprint retrospective, code review with lead engineer, and milestone deployment"',
    ];
    const csvContent = '\uFEFF' + [headers, ...sampleRows].join('\r\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `DTR_Practicum_Template_${activePlacement?.student_number || 'CPE'}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  // Helper to generate a realistic SVG signed HR proof
  const generateSampleProofSvg = (p) => {
    const company = (p?.company_name || 'Host Training Establishment').toUpperCase();
    const student = p?.student_name || 'BSCpE Practicum Intern';
    const num = p?.student_number || '2023-00108-MN-0';
    const supervisor = p?.company_contact_person || 'Engr. Industry Supervisor';
    const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="600" height="300" viewBox="0 0 600 300" style="background:#ffffff; font-family:system-ui,sans-serif;">
      <rect x="8" y="8" width="584" height="284" rx="6" fill="#ffffff" stroke="#cbd5e1" stroke-width="2"/>
      <rect x="18" y="18" width="564" height="42" rx="4" fill="#0f172a"/>
      <text x="300" y="44" fill="#ffffff" font-size="13.5" font-weight="700" text-anchor="middle" letter-spacing="1">CERTIFICATE OF PRACTICUM ATTENDANCE &amp; DTR</text>
      <text x="300" y="86" fill="#0f172a" font-size="13" font-weight="700" text-anchor="middle">${company}</text>
      <text x="300" y="104" fill="#64748b" font-size="11" text-anchor="middle">Official Industry Partner · Department of Computer Engineering</text>
      <line x1="36" y1="116" x2="564" y2="116" stroke="#e2e8f0" stroke-width="1"/>
      <text x="46" y="142" fill="#334155" font-size="12">This certifies that <tspan font-weight="700" fill="#0f172a">${student}</tspan> (${num})</text>
      <text x="46" y="162" fill="#334155" font-size="12">has rendered official on-the-job training shifts with certified cumulative hours:</text>
      <rect x="46" y="176" width="230" height="34" rx="4" fill="#f0fdf4" stroke="#86efac" stroke-width="1"/>
      <text x="161" y="198" fill="#15803d" font-size="14.5" font-weight="700" text-anchor="middle">300.00 HOURS CERTIFIED</text>
      <text x="46" y="235" fill="#64748b" font-size="10.5">Status: Complete · Verified Against HTE Biometrics / Daily Shift Logs</text>
      <line x1="380" y1="248" x2="540" y2="248" stroke="#0f172a" stroke-width="1.5"/>
      <text x="460" y="263" fill="#0f172a" font-size="11" font-weight="700" text-anchor="middle">${supervisor}</text>
      <text x="460" y="278" fill="#64748b" font-size="9.5" text-anchor="middle">Authorized HR / Technical Mentor Signature</text>
      <circle cx="515" cy="215" r="25" fill="#2563eb" fill-opacity="0.08" stroke="#2563eb" stroke-dasharray="3,2" stroke-width="1.5"/>
      <text x="515" y="213" fill="#2563eb" font-size="7.5" font-weight="700" text-anchor="middle">OFFICIAL</text>
      <text x="515" y="223" fill="#2563eb" font-size="7.5" font-weight="700" text-anchor="middle">HTE SEAL</text>
    </svg>`;
    return 'data:image/svg+xml;utf8,' + encodeURIComponent(svg);
  };

  const handleLoadSampleProof = () => {
    playClickSound();
    const dataUrl = generateSampleProofSvg(activePlacement);
    const fileName = `Signed_DTR_Proof_${activePlacement?.student_number || 'BSCpE'}.png`;
    setProofFile({ name: fileName });
    setProofPreviewUrl(dataUrl);
    setSignedHoursInput('300.00');
    if (activePlacement?.placement_id) {
      try {
        localStorage.setItem(
          `mit_ojt_signed_dtr_proof_${activePlacement.placement_id}`,
          JSON.stringify({
            fileName,
            url: dataUrl,
            signedHours: '300.00',
            uploadedAt: new Date().toISOString(),
          })
        );
      } catch {
        // ignore
      }
    }
  };

  // Helper to compute hours
  const computeNetHours = (timeIn, timeOut, breakMins = 60) => {
    const inParts = String(timeIn).split(':');
    const outParts = String(timeOut).split(':');
    if (inParts.length < 2 || outParts.length < 2) return 8.0;
    const inMin = Number(inParts[0]) * 60 + Number(inParts[1]);
    let outMin = Number(outParts[0]) * 60 + Number(outParts[1]);
    if (outMin <= inMin) outMin += 24 * 60;
    const net = Math.max(0, outMin - inMin - Number(breakMins));
    return parseFloat((net / 60).toFixed(2));
  };

  // Parse CSV / Tab-separated text from Excel
  const parseCsvContent = (text) => {
    const lines = text.trim().split(/\r?\n/).filter((l) => l.trim().length > 0);
    if (lines.length <= 1 && !lines[0]?.includes('\t') && !lines[0]?.includes(',')) {
      setParsedRows([]);
      return;
    }

    const rows = [];
    // Skip header line if present
    const startIndex = lines[0].toLowerCase().includes('date') ? 1 : 0;

    for (let i = startIndex; i < lines.length; i++) {
      const line = lines[i];
      let parts = [];
      if (line.includes('\t')) {
        parts = line.split('\t');
      } else if (line.includes(';') && !line.includes(',')) {
        parts = line.split(';');
      } else {
        parts = line.match(/(?:[^\s",]+|"[^"]*")+/g) || line.split(',');
      }

      if (parts.length >= 2) {
        const clean = (val) => (val || '').replace(/^"|"$/g, '').trim();
        const date = clean(parts[0]);
        const timeIn = clean(parts[1]) || '08:00';
        const timeOut = clean(parts[2]) || '17:00';
        const breakMins = parts[3] ? parseInt(clean(parts[3]), 10) || 60 : 60;
        const task = parts[4] ? clean(parts.slice(4).join(line.includes('\t') ? ' ' : ',')) : 'Daily technical practicum tasks rendered.';
        const hours = computeNetHours(timeIn, timeOut, breakMins);

        if (date && date.length >= 4) {
          rows.push({
            date,
            time_in: timeIn,
            time_out: timeOut,
            break_minutes: breakMins,
            hours_rendered: hours,
            task_description: task,
            approval_status: 'pending',
          });
        }
      }
    }
    setParsedRows(rows);
  };

  // Helper to generate a full 300-hour realistic practicum DTR batch
  const handleFillCompleteSample = () => {
    playClickSound();
    const rows = [];
    const engineeringTasks = [
      'Orientation, engineering workstation configuration, and safety protocol briefing',
      'Configured local development toolchain, cloned git repositories, and reviewed architecture',
      'Participated in daily technical standup and resolved database schema migration bugs',
      'Implemented stored procedure optimization and index profiling for query acceleration',
      'Developed REST API endpoints and integrated responsive front-end state handlers',
      'Sprint review, peer code inspection, and technical documentation drafting',
      'Conducted automated test suite executions and system integration validation',
      'Investigated production logging diagnostics and resolved cross-browser rendering defects',
      'Collaborated with senior engineering team on CI/CD pipeline automation scripts',
      'Finalized sprint deliverables, updated system documentation, and conducted milestone demo'
    ];

    let currentDate = new Date('2026-08-03');
    let dayCount = 0;
    while (rows.length < 38) { // 38 days * 8 hours = 304 hours (complete!)
      const dayOfWeek = currentDate.getDay();
      if (dayOfWeek !== 0 && dayOfWeek !== 6) { // Monday to Friday
        const dateStr = currentDate.toISOString().slice(0, 10);
        const task = engineeringTasks[dayCount % engineeringTasks.length];
        rows.push({
          date: dateStr,
          time_in: '08:00',
          time_out: '17:00',
          break_minutes: 60,
          hours_rendered: 8.0,
          task_description: task,
          approval_status: 'pending',
        });
        dayCount++;
      }
      currentDate.setDate(currentDate.getDate() + 1);
    }
    setParsedRows(rows);
    setFileName('Generated_300H_Full_Practicum.csv');
  };

  const handleFileUpload = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setFileName(file.name);
    const reader = new FileReader();
    reader.onload = (evt) => {
      const text = evt.target.result;
      setCsvText(text);
      parseCsvContent(text);
    };
    reader.readAsText(file);
  };

  // Submit parsed batch to backend
  const handleTransferToDatabase = async () => {
    if (parsedRows.length === 0) return;
    setIsSubmitting(true);
    playClickSound();

    try {
      const res = await fetch('/api/timelogs', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          placement_id: activePlacement.placement_id,
          batch: parsedRows,
          approval_status: currentUser?.role === 'student' ? 'pending' : 'approved',
        }),
      });
      const json = await res.json();
      if (json.ok) {
        playSuccessChime();
        if (onSuccess) onSuccess(json.message);
        setActiveTab('audit');
      } else {
        alert(json.error || 'Failed to transfer DTR batch records.');
      }
    } catch (err) {
      alert('Error transferring DTR batch: ' + err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Handle proof upload
  const handleProofUpload = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setProofFile(file);
    const reader = new FileReader();
    reader.onload = (evt) => {
      const dataUrl = evt.target.result;
      setProofPreviewUrl(dataUrl);
      if (activePlacement?.placement_id) {
        try {
          localStorage.setItem(
            `mit_ojt_signed_dtr_proof_${activePlacement.placement_id}`,
            JSON.stringify({
              fileName: file.name,
              url: dataUrl,
              signedHours: signedHoursInput,
              uploadedAt: new Date().toISOString(),
            })
          );
        } catch {
          // ignore storage quota
        }
      }
    };
    reader.readAsDataURL(file);
    playClickSound();
  };

  // Adviser Endorse Complete DTR
  const handleAdviserEndorseDtr = async () => {
    if (!activePlacement) return;
    setIsSubmitting(true);
    playClickSound();

    try {
      const res = await fetch('/api/timelogs/approve-all', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          placement_id: activePlacement.placement_id,
          target_status: 'approved',
        }),
      });
      const json = await res.json();
      if (json.ok) {
        playCelebrationFanfare();
        launchConfetti();
        if (onSuccess) onSuccess('Official DTR verified & endorsed! Student required hours marked completed.');
        onClose();
      } else {
        alert(json.error || 'Failed to endorse DTR.');
      }
    } catch (err) {
      alert('Error endorsing DTR: ' + err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const totalBatchHours = useMemo(() => {
    return parsedRows.reduce((sum, r) => sum + Number(r.hours_rendered || 0), 0);
  }, [parsedRows]);

  const signedHoursNum = parseFloat(signedHoursInput) || 0;
  const isHoursMatched = Math.abs(databaseHours - signedHoursNum) < 0.5;

  if (!isOpen) return null;

  return (
    <div className="modal-backdrop" onClick={onClose} role="dialog" aria-modal="true">
      <div className="modal-card modal-entry-card" style={{ maxWidth: '820px' }} onClick={(e) => e.stopPropagation()}>
        {/* MODAL HEADER */}
        <div className="modal-header">
          <div className="modal-header-identity">
            <div className="modal-header-icon-box">
              <IconClock size={18} />
            </div>
            <div>
              <div className="modal-title">DTR Transfer &amp; Signed Verification Studio</div>
              <div className="modal-subtitle">
                Transfer batch attendance records from Excel, attach signed HR copies, and cross-verify hours
              </div>
            </div>
          </div>
          <button type="button" className="modal-close-btn" onClick={onClose} aria-label="Close dialog">
            <IconClose size={16} />
          </button>
        </div>

        {/* PLACEMENT TARGET SELECTOR (FOR ADVISER / ADMIN) */}
        {placements.length > 1 && currentUser?.role !== 'student' && (
          <div style={{ padding: '12px 24px 0', display: 'flex', alignItems: 'center', gap: '10px' }}>
            <span style={{ fontSize: '12px', fontWeight: 600, color: 'var(--text-secondary)' }}>Student Placement:</span>
            <MaterialSelect
              className="select-sm"
              value={selectedPlacementId}
              onChange={(e) => setSelectedPlacementId(e.target.value)}
              style={{ flex: 1 }}
            >
              {placements.map((p) => (
                <option key={p.placement_id} value={p.placement_id}>
                  {p.student_name} — {p.company_name} ({Number(p.total_hours_completed || 0).toFixed(1)} / {Number(p.required_hours || 300).toFixed(0)}h)
                </option>
              ))}
            </MaterialSelect>
          </div>
        )}

        {/* LIQUID GLASS SEGMENTED CONTROL TABS */}
        <div style={{ padding: '14px 24px 8px' }}>
          <SegmentedControl
            items={[
              { value: 'import', label: '1. Transfer Excel / CSV Logs' },
              { value: 'proof', label: '2. Upload Signed HR Proof' },
              { value: 'audit', label: '3. Adviser Audit & Endorsement' },
            ]}
            value={activeTab}
            onValueChange={setActiveTab}
          />
        </div>

        <div className="modal-body modal-entry-body">
          {/* TAB 1: EXCEL / CSV BATCH TRANSFER */}
          {activeTab === 'import' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: '12px 16px',
                  background: 'var(--bg-subtle)',
                  borderRadius: 'var(--radius-md)',
                  border: '1px solid var(--border-default)',
                }}
              >
                <div>
                  <div style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-primary)' }}>
                    Standard Daily Time Record (DTR) Spreadsheet Template
                  </div>
                  <div style={{ fontSize: '11.5px', color: 'var(--text-muted)', marginTop: '2px' }}>
                    Download the official template, fill in your daily shifts in Excel, and upload here
                  </div>
                </div>
                <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                  <button
                    type="button"
                    className="btn btn-secondary btn-sm"
                    onClick={handleDownloadTemplate}
                    title="Download Excel / CSV template"
                  >
                    <IconDownload size={13} />
                    Download Excel Template
                  </button>
                  <button
                    type="button"
                    className="btn btn-secondary btn-sm"
                    onClick={handleFillCompleteSample}
                    title="Generate standard 304-hour complete practicum batch (38 days × 8h)"
                  >
                    <IconPlus size={13} />
                    Auto-Fill 300h Sample
                  </button>
                </div>
              </div>

              {/* UPLOAD DROP ZONE */}
              <div
                style={{
                  border: '2px dashed var(--border-strong)',
                  borderRadius: 'var(--radius-lg)',
                  padding: '20px 20px',
                  textAlign: 'center',
                  background: 'var(--bg-surface)',
                  cursor: 'pointer',
                  transition: 'all 0.16s ease',
                }}
                onClick={() => fileInputRef.current?.click()}
              >
                <input
                  type="file"
                  ref={fileInputRef}
                  accept=".csv,text/csv,text/plain"
                  style={{ display: 'none' }}
                  onChange={handleFileUpload}
                />
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '6px' }}>
                  <IconDownload size={26} style={{ color: 'var(--brand)' }} />
                  <div style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-primary)' }}>
                    {fileName ? `Loaded: ${fileName}` : 'Click or Drag & Drop filled DTR Spreadsheet (.csv)'}
                  </div>
                  <div style={{ fontSize: '11.5px', color: 'var(--text-muted)' }}>
                    Auto-computes hours from Time In, Time Out, and Break duration
                  </div>
                </div>
              </div>

              {/* DIRECT EXCEL CLIPBOARD PASTE BOX */}
              <div
                style={{
                  padding: '12px 14px',
                  background: 'var(--bg-subtle)',
                  borderRadius: 'var(--radius-md)',
                  border: '1px solid var(--border-default)',
                }}
              >
                <div style={{ fontSize: '12px', fontWeight: 600, color: 'var(--text-primary)', marginBottom: '6px' }}>
                  Or Paste Copied Cells Directly from Excel (Ctrl + V):
                </div>
                <textarea
                  className="input"
                  style={{ width: '100%', minHeight: '68px', fontSize: '11.5px', fontFamily: 'monospace' }}
                  placeholder="Paste rows copied from Excel here (tab-delimited or comma-separated: Date | Time In | Time Out | Break | Task)..."
                  value={csvText}
                  onChange={(e) => {
                    setCsvText(e.target.value);
                    setFileName('Pasted_from_Excel.txt');
                    parseCsvContent(e.target.value);
                  }}
                />
              </div>

              {/* LIVE PARSED PREVIEW TABLE */}
              {parsedRows.length > 0 && (
                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                    <span style={{ fontSize: '12.5px', fontWeight: 600, color: 'var(--text-primary)' }}>
                      Preview Parsed DTR Entries ({parsedRows.length} Days)
                    </span>
                    <span
                      style={{
                        fontSize: '12px',
                        fontWeight: 700,
                        color: 'var(--brand)',
                        background: 'var(--brand-subtle)',
                        padding: '2px 8px',
                        borderRadius: 'var(--radius-pill)',
                      }}
                    >
                      Total Batch: {totalBatchHours.toFixed(2)} Hours
                    </span>
                  </div>

                  <div className="table-wrap" style={{ maxHeight: '200px', overflowY: 'auto' }}>
                    <table className="table">
                      <thead>
                        <tr>
                          <th>Date</th>
                          <th>In</th>
                          <th>Out</th>
                          <th>Break</th>
                          <th className="text-right">Net Hours</th>
                          <th>Task Summary</th>
                        </tr>
                      </thead>
                      <tbody>
                        {parsedRows.slice(0, 15).map((r, i) => (
                          <tr key={i}>
                            <td className="mono">{r.date}</td>
                            <td className="mono">{r.time_in}</td>
                            <td className="mono">{r.time_out}</td>
                            <td className="mono">{r.break_minutes}m</td>
                            <td className="text-right mono tabular-nums" style={{ fontWeight: 600 }}>
                              {Number(r.hours_rendered).toFixed(2)}
                            </td>
                            <td style={{ fontSize: '11.5px' }}>{r.task_description}</td>
                          </tr>
                        ))}
                        {parsedRows.length > 15 && (
                          <tr>
                            <td colSpan={6} style={{ textAlign: 'center', color: 'var(--text-muted)', fontSize: '11px' }}>
                              ... and {parsedRows.length - 15} more daily attendance rows
                            </td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>

                  <div style={{ marginTop: '14px', display: 'flex', justifyContent: 'flex-end', gap: '8px' }}>
                    <button
                      type="button"
                      className="btn btn-primary"
                      onClick={handleTransferToDatabase}
                      disabled={isSubmitting}
                    >
                      <IconCheckCircle size={14} />
                      {isSubmitting ? 'Transferring...' : `Transfer ${parsedRows.length} Records to System`}
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* TAB 2: UPLOAD SIGNED HR PROOF */}
          {activeTab === 'proof' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div
                style={{
                  padding: '12px 16px',
                  background: 'var(--bg-subtle)',
                  borderRadius: 'var(--radius-md)',
                  border: '1px solid var(--border-default)',
                }}
              >
                <div style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-primary)' }}>
                  Attach Official Signed DTR / Certificate of Completion
                </div>
                <div style={{ fontSize: '11.5px', color: 'var(--text-muted)', marginTop: '2px' }}>
                  Upload the physical copy signed by your HTE Supervisor or company HR with company letterhead/stamp
                </div>
              </div>

              <div className="field-grid-2">
                <div className="field">
                  <label className="field-label">Total Certified Hours on Signed Sheet</label>
                  <input
                    type="number"
                    step="0.5"
                    className="input mono tabular-nums"
                    value={signedHoursInput}
                    onChange={(e) => {
                      const val = e.target.value;
                      setSignedHoursInput(val);
                      if (activePlacement?.placement_id) {
                        try {
                          const existing = localStorage.getItem(`mit_ojt_signed_dtr_proof_${activePlacement.placement_id}`);
                          const parsed = existing ? JSON.parse(existing) : {};
                          localStorage.setItem(
                            `mit_ojt_signed_dtr_proof_${activePlacement.placement_id}`,
                            JSON.stringify({ ...parsed, signedHours: val })
                          );
                        } catch {
                          // ignore
                        }
                      }
                    }}
                    placeholder="e.g. 300.00"
                    required
                  />
                  <span className="field-hint">Hours explicitly certified by the supervisor/HR</span>
                </div>

                <div className="field">
                  <label className="field-label">Signed Document Upload</label>
                  <div style={{ display: 'flex', gap: '8px' }}>
                    <button
                      type="button"
                      className="btn btn-secondary"
                      style={{ flex: 1, height: '40px' }}
                      onClick={() => proofInputRef.current?.click()}
                    >
                      <IconDownload size={14} />
                      {proofFile ? proofFile.name : 'Select Scanned DTR (PDF / Image)'}
                    </button>
                    <button
                      type="button"
                      className="btn btn-secondary"
                      style={{ height: '40px' }}
                      onClick={handleLoadSampleProof}
                      title="Load official certified completion document for instant demonstration"
                    >
                      <IconShieldCheck size={14} />
                      Sample
                    </button>
                  </div>
                  <input
                    type="file"
                    ref={proofInputRef}
                    accept="image/*,.pdf"
                    style={{ display: 'none' }}
                    onChange={handleProofUpload}
                  />
                </div>
              </div>

              {/* DOCUMENT PROOF PREVIEW */}
              {proofPreviewUrl ? (
                <div
                  style={{
                    border: '1px solid var(--border-default)',
                    borderRadius: 'var(--radius-md)',
                    padding: '14px',
                    background: 'var(--bg-surface)',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '10px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <IconCheckCircle size={15} style={{ color: 'var(--success-fg)' }} />
                      <span style={{ fontSize: '12.5px', fontWeight: 600, color: 'var(--text-primary)' }}>
                        Signed Document Attached: {proofFile?.name}
                      </span>
                    </div>
                    <span
                      style={{
                        fontSize: '11px',
                        background: 'var(--success-bg)',
                        color: 'var(--success-fg)',
                        padding: '2px 8px',
                        borderRadius: 'var(--radius-pill)',
                        fontWeight: 600,
                      }}
                    >
                      HR Signature Attached
                    </span>
                  </div>
                  <div style={{ textAlign: 'center', maxHeight: '240px', overflow: 'hidden', borderRadius: '4px' }}>
                    <img
                      src={proofPreviewUrl}
                      alt="Signed DTR Preview"
                      style={{ maxWidth: '100%', maxHeight: '240px', objectFit: 'contain' }}
                    />
                  </div>
                </div>
              ) : (
                <div
                  style={{
                    padding: '28px',
                    textAlign: 'center',
                    background: 'var(--bg-subtle)',
                    borderRadius: 'var(--radius-md)',
                    border: '1px dashed var(--border-default)',
                    color: 'var(--text-muted)',
                  }}
                >
                  No signed proof uploaded yet. Select your signed DTR file above.
                </div>
              )}

              {verificationPushed && (
                <div
                  style={{
                    padding: '12px 16px',
                    background: 'var(--success-bg)',
                    border: '1px solid var(--success-border)',
                    borderRadius: 'var(--radius-md)',
                    color: 'var(--success-fg)',
                    fontSize: '12.5px',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                  }}
                >
                  <IconCheckCircle size={16} />
                  <span>
                    Signed DTR submitted! Pushed to your Faculty Adviser ({activePlacement?.adviser_name || 'Coordinator'}) to verify against your system attendance records.
                  </span>
                </div>
              )}

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px', marginTop: '10px' }}>
                <button
                  type="button"
                  className="btn btn-primary"
                  onClick={() => {
                    playSuccessChime();
                    setVerificationPushed(true);
                    if (onSuccess) {
                      onSuccess(
                        `Signed DTR submitted! Pushed to ${activePlacement?.adviser_name || 'Faculty Adviser'} for completion verification.`
                      );
                    }
                    setActiveTab('audit');
                  }}
                >
                  <IconShieldCheck size={14} />
                  {currentUser?.role === 'student'
                    ? 'Push Verification to Adviser'
                    : 'Proceed to Cross-Audit & Verification'}
                </button>
              </div>
            </div>
          )}

          {/* TAB 3: ADVISER CROSS-AUDIT & ENDORSEMENT */}
          {activeTab === 'audit' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div
                style={{
                  padding: '12px 16px',
                  background: 'var(--bg-subtle)',
                  borderRadius: 'var(--radius-md)',
                  border: '1px solid var(--border-default)',
                }}
              >
                <div style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-primary)' }}>
                  Faculty Adviser DTR Cross-Audit Ledger
                </div>
                <div style={{ fontSize: '11.5px', color: 'var(--text-muted)', marginTop: '2px' }}>
                  Cross-verify the signed physical DTR against system computed attendance records
                </div>
              </div>

              {/* AUDIT METRIC COMPARISON STRIP */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '12px' }}>
                <div
                  style={{
                    padding: '14px',
                    borderRadius: 'var(--radius-md)',
                    background: 'var(--bg-surface)',
                    border: '1px solid var(--border-default)',
                  }}
                >
                  <div style={{ fontSize: '11px', color: 'var(--text-muted)', fontWeight: 600 }}>Signed Document Hours</div>
                  <div style={{ fontSize: '20px', fontWeight: 700, color: 'var(--text-primary)', marginTop: '4px' }} className="mono">
                    {signedHoursNum.toFixed(2)}h
                  </div>
                  <div style={{ fontSize: '10.5px', color: 'var(--text-muted)', marginTop: '2px' }}>
                    Certified by {activePlacement?.company_contact_person || 'HTE HR'}
                  </div>
                </div>

                <div
                  style={{
                    padding: '14px',
                    borderRadius: 'var(--radius-md)',
                    background: 'var(--bg-surface)',
                    border: '1px solid var(--border-default)',
                  }}
                >
                  <div style={{ fontSize: '11px', color: 'var(--text-muted)', fontWeight: 600 }}>System Database Hours</div>
                  <div style={{ fontSize: '20px', fontWeight: 700, color: 'var(--brand)', marginTop: '4px' }} className="mono">
                    {databaseHours.toFixed(2)}h
                  </div>
                  <div style={{ fontSize: '10.5px', color: 'var(--text-muted)', marginTop: '2px' }}>
                    SUM'd across {placementLogs.length} logged shift rows
                  </div>
                </div>

                <div
                  style={{
                    padding: '14px',
                    borderRadius: 'var(--radius-md)',
                    background: isHoursMatched ? 'var(--success-bg)' : 'var(--warning-bg)',
                    border: '1px solid ' + (isHoursMatched ? 'var(--success-border)' : 'var(--warning-border)'),
                  }}
                >
                  <div style={{ fontSize: '11px', color: isHoursMatched ? 'var(--success-fg)' : 'var(--warning-fg)', fontWeight: 600 }}>
                    Verification Status
                  </div>
                  <div
                    style={{
                      fontSize: '15px',
                      fontWeight: 700,
                      color: isHoursMatched ? 'var(--success-fg)' : 'var(--warning-fg)',
                      marginTop: '6px',
                    }}
                  >
                    {isHoursMatched ? 'Verified Consistent' : 'Pending Audit'}
                  </div>
                  <div style={{ fontSize: '10.5px', color: isHoursMatched ? 'var(--success-fg)' : 'var(--warning-fg)', marginTop: '2px' }}>
                    {isHoursMatched
                      ? 'Signed hours match system records'
                      : `Difference: ${Math.abs(databaseHours - signedHoursNum).toFixed(2)}h`}
                  </div>
                </div>
              </div>

              {/* SIDE-BY-SIDE VERIFICATION: SIGNED DOCUMENT VS SYSTEM INPUTTED LOGS */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px', marginTop: '2px' }}>
                {/* LEFT: SIGNED PROOF FROM SUPERVISOR */}
                <div
                  style={{
                    border: '1px solid var(--border-default)',
                    borderRadius: 'var(--radius-md)',
                    padding: '12px',
                    background: 'var(--bg-surface)',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '8px',
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ fontSize: '12px', fontWeight: 700, color: 'var(--text-primary)' }}>
                      1. Signed DTR Proof (Supervisor)
                    </span>
                    <span
                      style={{
                        fontSize: '10.5px',
                        background: 'var(--success-bg)',
                        color: 'var(--success-fg)',
                        padding: '1px 6px',
                        borderRadius: 'var(--radius-pill)',
                        fontWeight: 600,
                      }}
                    >
                      Certified: {signedHoursNum.toFixed(1)}h
                    </span>
                  </div>
                  <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
                    Company: {activePlacement?.company_name} · Signatory: {activePlacement?.company_contact_person || 'HTE HR / Supervisor'}
                  </div>
                  <div
                    style={{
                      minHeight: '130px',
                      maxHeight: '170px',
                      overflow: 'hidden',
                      borderRadius: 'var(--radius-sm)',
                      background: 'var(--bg-subtle)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      border: '1px solid var(--border-default)',
                    }}
                  >
                    {proofPreviewUrl ? (
                      <img
                        src={proofPreviewUrl}
                        alt="Signed DTR Preview"
                        style={{ maxWidth: '100%', maxHeight: '160px', objectFit: 'contain' }}
                      />
                    ) : (
                      <div style={{ padding: '16px', textAlign: 'center', color: 'var(--text-muted)', fontSize: '11.5px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '6px' }}>
                        <span>No physical scan uploaded yet for this trainee.</span>
                        <button
                          type="button"
                          className="btn btn-secondary btn-xs"
                          onClick={handleLoadSampleProof}
                        >
                          <IconShieldCheck size={12} />
                          Load Sample Verified HTE Certificate
                        </button>
                      </div>
                    )}
                  </div>
                </div>

                {/* RIGHT: SYSTEM LOGS INPUTTED BY STUDENT */}
                <div
                  style={{
                    border: '1px solid var(--border-default)',
                    borderRadius: 'var(--radius-md)',
                    padding: '12px',
                    background: 'var(--bg-surface)',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '8px',
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ fontSize: '12px', fontWeight: 700, color: 'var(--text-primary)' }}>
                      2. System DTR Inputted (Student)
                    </span>
                    <span
                      style={{
                        fontSize: '10.5px',
                        background: 'var(--badge-bg)',
                        color: 'var(--brand)',
                        padding: '1px 6px',
                        borderRadius: 'var(--radius-pill)',
                        fontWeight: 600,
                      }}
                    >
                      Database: {databaseHours.toFixed(1)}h ({placementLogs.length} shifts)
                    </span>
                  </div>
                  <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
                    Trainee: {activePlacement?.student_name} ({activePlacement?.student_number})
                  </div>
                  <div
                    style={{
                      maxHeight: '170px',
                      overflowY: 'auto',
                      borderRadius: 'var(--radius-sm)',
                      border: '1px solid var(--border-default)',
                    }}
                  >
                    <table className="table table-compact" style={{ width: '100%', fontSize: '11px' }}>
                      <thead>
                        <tr>
                          <th>Date</th>
                          <th>Time</th>
                          <th>Hours</th>
                          <th>Task</th>
                        </tr>
                      </thead>
                      <tbody>
                        {placementLogs.slice(0, 8).map((tl) => (
                          <tr key={tl.log_id}>
                            <td className="mono">{tl.date}</td>
                            <td className="mono">{tl.time_in}-{tl.time_out}</td>
                            <td className="mono font-bold">{Number(tl.hours_rendered).toFixed(1)}h</td>
                            <td style={{ maxWidth: '110px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                              {tl.task_description}
                            </td>
                          </tr>
                        ))}
                        {placementLogs.length > 8 && (
                          <tr>
                            <td colSpan={4} style={{ textAlign: 'center', color: 'var(--text-muted)', fontSize: '10px' }}>
                              + {placementLogs.length - 8} additional shift entries in database
                            </td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>

              {/* AUTOMATED COMPLETION CALLOUT */}
              {databaseHours >= Number(activePlacement?.required_hours || 300) ? (
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '12px',
                    padding: '14px 16px',
                    background: 'var(--success-bg)',
                    border: '1px solid var(--success-border)',
                    borderRadius: 'var(--radius-md)',
                  }}
                >
                  <IconCheckCircle size={20} style={{ color: 'var(--success-fg)', flexShrink: 0 }} />
                  <div>
                    <div style={{ fontSize: '13px', fontWeight: 700, color: 'var(--success-fg)' }}>
                      Practicum Standard Met ({databaseHours.toFixed(1)} / {Number(activePlacement?.required_hours || 300).toFixed(0)} Hours)
                    </div>
                    <div style={{ fontSize: '11.5px', color: 'var(--success-fg)', marginTop: '2px' }}>
                      The system will automatically set the placement to <strong>Completed</strong> and issue the official Clearance Certificate Reference.
                    </div>
                  </div>
                </div>
              ) : (
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '12px',
                    padding: '12px 16px',
                    background: 'var(--info-bg)',
                    border: '1px solid var(--info-border)',
                    borderRadius: 'var(--radius-md)',
                  }}
                >
                  <IconClock size={18} style={{ color: 'var(--info-fg)', flexShrink: 0 }} />
                  <div>
                    <div style={{ fontSize: '12.5px', fontWeight: 600, color: 'var(--info-fg)' }}>
                      In Progress: {databaseHours.toFixed(1)} / {Number(activePlacement?.required_hours || 300).toFixed(0)} Hours ({(databaseHours / Number(activePlacement?.required_hours || 300) * 100).toFixed(1)}%)
                    </div>
                    <div style={{ fontSize: '11px', color: 'var(--info-fg)', marginTop: '1px' }}>
                      Remaining hours needed for final clearance: {(Number(activePlacement?.required_hours || 300) - databaseHours).toFixed(1)} hrs.
                    </div>
                  </div>
                </div>
              )}

              {/* ACTION FOOTER */}
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px', marginTop: '12px' }}>
                <button type="button" className="btn btn-secondary" onClick={onClose}>
                  Close
                </button>
                {(currentUser?.role === 'adviser' || currentUser?.role === 'admin') && (
                  <button
                    type="button"
                    className="btn btn-primary"
                    onClick={handleAdviserEndorseDtr}
                    disabled={isSubmitting}
                  >
                    <IconShieldCheck size={14} />
                    {isSubmitting ? 'Endorsing...' : 'Endorse DTR & Credit Hours'}
                  </button>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
