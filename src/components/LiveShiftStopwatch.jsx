import React, { useState, useEffect } from 'react';
import { IconClock, IconCheckCircle, IconEdit } from './Icons';
import { playClickSound, playSuccessChime } from '../utils/soundEffects';

export default function LiveShiftStopwatch({
  activeShift,
  onClockIn,
  onClockOut,
  myPlacement,
  onLogQuickMilestone,
}) {
  const [elapsed, setElapsed] = useState(0);
  const [breakMins, setBreakMins] = useState(60);
  const [milestoneText, setMilestoneText] = useState('');
  const [showMilestoneInput, setShowMilestoneInput] = useState(false);

  useEffect(() => {
    if (!activeShift?.startedAt) {
      setElapsed(0);
      return;
    }

    const calc = () => {
      const diffSecs = Math.max(0, Math.floor((Date.now() - activeShift.startedAt) / 1000));
      setElapsed(diffSecs);
    };

    calc();
    const interval = setInterval(calc, 1000);
    return () => clearInterval(interval);
  }, [activeShift]);

  const hours = Math.floor(elapsed / 3600);
  const minutes = Math.floor((elapsed % 3600) / 60);
  const seconds = elapsed % 60;

  const pad = (n) => String(n).padStart(2, '0');

  // Estimate hours rendered today
  const estGrossHours = elapsed / 3600;
  const estNetHours = Math.max(0, estGrossHours - breakMins / 60);

  const handleAddMilestone = (e) => {
    e.preventDefault();
    if (!milestoneText.trim()) return;
    if (onLogQuickMilestone) {
      onLogQuickMilestone(milestoneText.trim());
      playSuccessChime();
    }
    setMilestoneText('');
    setShowMilestoneInput(false);
  };

  if (!activeShift) {
    return (
      <div className="stopwatch-idle-card">
        <div className="stopwatch-idle-left">
          <div className="stopwatch-idle-badge">Practicum Attendance</div>
          <div className="stopwatch-idle-title">Ready to Start Today's Shift?</div>
          <div className="stopwatch-idle-sub">
            {myPlacement
              ? `Assigned to ${myPlacement.company_name} · Required: 300 hrs`
              : 'Select your host training establishment to track hours'}
          </div>
        </div>
        <div className="stopwatch-idle-right">
          <button
            type="button"
            className="btn btn-primary"
            onClick={() => {
              playClickSound();
              onClockIn();
            }}
            disabled={!myPlacement}
          >
            <IconClock size={15} />
            <span>Clock In for Today</span>
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="stopwatch-active-card">
      <div className="stopwatch-active-header">
        <div className="stopwatch-beacon-group">
          <span className="stopwatch-beacon-pulse" />
          <span className="stopwatch-beacon-text">ACTIVE PRACTICUM SHIFT</span>
        </div>
        <div className="stopwatch-company-tag">
          {myPlacement?.company_name || 'Host Training Establishment'}
        </div>
      </div>

      <div className="stopwatch-active-content">
        <div className="stopwatch-counter-block">
          <div className="stopwatch-digits">
            <span className="digit">{pad(hours)}</span>
            <span className="colon">:</span>
            <span className="digit">{pad(minutes)}</span>
            <span className="colon">:</span>
            <span className="digit">{pad(seconds)}</span>
          </div>
          <div className="stopwatch-digits-sub">
            Clocked in at {activeShift.time_in} · Date: {activeShift.date}
          </div>
        </div>

        <div className="stopwatch-meta-strip">
          <div className="stopwatch-meta-item">
            <div className="meta-label">Est. Net Hours</div>
            <div className="meta-val">{estNetHours.toFixed(2)} hrs</div>
          </div>
          <div className="stopwatch-meta-item">
            <div className="meta-label">Break Deduction</div>
            <div className="meta-controls">
              <button
                type="button"
                className="btn-micro"
                onClick={() => {
                  playClickSound();
                  setBreakMins((p) => Math.max(0, p - 15));
                }}
                title="Decrease break by 15m"
              >
                -15m
              </button>
              <span className="break-display">{breakMins}m</span>
              <button
                type="button"
                className="btn-micro"
                onClick={() => {
                  playClickSound();
                  setBreakMins((p) => p + 15);
                }}
                title="Increase break by 15m"
              >
                +15m
              </button>
            </div>
          </div>
        </div>
      </div>

      {showMilestoneInput ? (
        <form className="stopwatch-milestone-form" onSubmit={handleAddMilestone}>
          <input
            type="text"
            className="input"
            placeholder="e.g., Finished UART testbench coverage & submitted daily status report..."
            value={milestoneText}
            onChange={(e) => setMilestoneText(e.target.value)}
            autoFocus
          />
          <div style={{ display: 'flex', gap: '6px' }}>
            <button type="submit" className="btn btn-primary btn-sm">Save Note</button>
            <button
              type="button"
              className="btn btn-secondary btn-sm"
              onClick={() => setShowMilestoneInput(false)}
            >
              Cancel
            </button>
          </div>
        </form>
      ) : (
        <div className="stopwatch-actions-row">
          <button
            type="button"
            className="btn btn-secondary btn-sm"
            onClick={() => {
              playClickSound();
              setShowMilestoneInput(true);
            }}
          >
            <IconEdit size={13} />
            <span>Add Task Note</span>
          </button>

          <button
            type="button"
            className="btn btn-primary btn-sm"
            onClick={() => {
              playClickSound();
              onClockOut();
            }}
          >
            <IconCheckCircle size={14} />
            <span>Clock Out & Log DTR</span>
          </button>
        </div>
      )}
    </div>
  );
}
