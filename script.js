        const deptStructure = [
            { name: "CSE", sections: ["CSE-A", "CSE-B", "CSE-C", "CSE-D"] },
            { name: "AI & DS", sections: ["AI & DS-A", "AI & DS-B", "AI & DS-C", "AI & DS-D"] },
            { name: "AI & ML", sections: ["AI & ML-A", "AI & ML-B"] },
            { name: "IT", sections: ["IT-A"] },
            { name: "CSBS", sections: ["CSBS-A"] },
            { name: "ECE", sections: ["ECE-A", "ECE-B"] },
            { name: "EEE", sections: ["EEE-A"] },
            { name: "EEE (VLSI)", sections: ["EEE (VLSI)-A"] },
            { name: "Mechanical", sections: ["Mechanical-A"] }
        ];

        function updateDepartments() {
            const deptSelect = document.getElementById('inDept');
            deptSelect.innerHTML = "";
            deptStructure.forEach(dept => {
                dept.sections.forEach(sec => {
                    const opt = document.createElement('option');
                    opt.value = sec;
                    opt.textContent = sec;
                    deptSelect.appendChild(opt);
                });
            });
        }

        window.addEventListener('DOMContentLoaded', () => {
            updateDepartments();
        });

        function toggleOtherPurpose() {
            const purposeVal = document.getElementById('inPurpose').value;
            const otherGroup = document.getElementById('otherPurposeGroup');
            if (purposeVal === 'Others') {
                otherGroup.style.display = 'block';
                document.getElementById('inOtherPurpose').setAttribute('required', 'true');
            } else {
                otherGroup.style.display = 'none';
                document.getElementById('inOtherPurpose').removeAttribute('required');
            }
        }

        function toggleOtherZone() {
            const zoneVal = document.getElementById('inZone').value;
            const otherGroup = document.getElementById('otherZoneGroup');
            if (zoneVal === 'Others') {
                otherGroup.style.display = 'block';
                document.getElementById('inOtherZone').setAttribute('required', 'true');
            } else {
                otherGroup.style.display = 'none';
                document.getElementById('inOtherZone').removeAttribute('required');
            }
        }

        let odRecords = [
            {
                id: 1,
                name: "Kavya Subramanian",
                roll: "22CS012",
                dept: "CSE-A",
                purpose: "Hackathon / Technical Event Organizing",
                slot: "Period 1 - 3",
                assignedZone: "Main Block & Auditorium",
                liveLocation: "Main Block (1st Floor Hall)",
                geofenceOk: true,
                matchScore: 99,
                status: "Approved",
                strikes: 0
            },
            {
                id: 2,
                name: "Arjun Krishnan",
                roll: "23EC034",
                dept: "ECE-B",
                purpose: "Center of Excellence (CoE) Lab Project",
                slot: "Full Day Campus Event",
                assignedZone: "Center of Excellence (CoE) Labs",
                liveLocation: "Robotics & IoT CoE Lab",
                geofenceOk: true,
                matchScore: 97,
                status: "Approved",
                strikes: 0
            },
            {
                id: 3,
                name: "Deepak Raj",
                roll: "22IT089",
                dept: "IT-A",
                purpose: "NAAC / NBA Accreditation File Work",
                slot: "Period 4 - 5",
                assignedZone: "Central Library & IQAC",
                liveLocation: "Sports Complex Ground (Out of Zone!)",
                geofenceOk: false,
                matchScore: 38,
                status: "Alert",
                strikes: 2 // 2 strikes already
            },
            {
                id: 4,
                name: "Sneha Nair",
                roll: "23AD019",
                dept: "AI & DS-C",
                purpose: "Placement Drive Volunteer Duty",
                slot: "Afternoon Session",
                assignedZone: "Admin & Placement Cell",
                liveLocation: "Admin Block Lobby",
                geofenceOk: true,
                matchScore: 96,
                status: "Pending",
                strikes: 0
            }
        ];

        let timerInterval = null;
        let secondsElapsed = 0;
        let currentStudentRoll = null;
        let isSimulatedViolation = false;

        // Session & Strike Ledger helpers
        function getStrikeLedger() {
            const data = localStorage.getItem('sece_strike_ledger');
            return data ? JSON.parse(data) : {}; // Format: { "22IT089": 3 }
        }

        function saveStrikeLedger(ledger) {
            localStorage.setItem('sece_strike_ledger', JSON.stringify(ledger));
        }

        function requestStaffAccess() {
            const authStatus = sessionStorage.getItem('sece_staff_auth');
            if (authStatus === 'true') {
                switchTab('staff');
            } else {
                document.getElementById('loginModal').style.display = 'flex';
            }
        }

        function closeLoginModal() {
            document.getElementById('loginModal').style.display = 'none';
        }

        function handleStaffLogin(e) {
            e.preventDefault();
            const email = document.getElementById('loginEmail').value;
            if (email.includes('@sece.ac.in')) {
                sessionStorage.setItem('sece_staff_auth', 'true');
                closeLoginModal();
                switchTab('staff');
            } else {
                document.getElementById('loginError').style.display = 'block';
            }
        }

        function logoutStaff() {
            sessionStorage.removeItem('sece_staff_auth');
            alert("Control room session locked securely.");
            switchTab('student');
        }

        function switchTab(tab) {
            document.querySelectorAll('.nav-btn').forEach(b => b.classList.remove('active'));
            document.querySelectorAll('.section').forEach(s => s.classList.remove('active'));

            if (tab === 'student') {
                document.getElementById('tabStudentBtn').classList.add('active');
                document.getElementById('studentSection').classList.add('active');
            } else {
                const authStatus = sessionStorage.getItem('sece_staff_auth');
                if (authStatus !== 'true') {
                    requestStaffAccess();
                    return;
                }
                document.getElementById('tabStaffBtn').classList.add('active');
                document.getElementById('staffSection').classList.add('active');
                renderTable();
            }
        }

        function openPinTelemetry(name, roll, assigned, current, match, status, strikes) {
            document.getElementById('modalStudentTitle').innerHTML = `<i class="fa-solid fa-satellite-dish" style="color:var(--secondary)"></i> Live Telemetry: ${name}`;
            document.getElementById('modalName').innerText = name;
            document.getElementById('modalRoll').innerText = roll;
            document.getElementById('modalAssigned').innerText = assigned;
            document.getElementById('modalCurrentLoc').innerText = current;
            
            const statusEl = document.getElementById('modalStatus');
            if (match < 50 || status === 'Alert') {
                statusEl.style.color = 'var(--danger)';
                statusEl.innerText = `Out of Zone Alert (${match}% Match) — Red Flags: ${strikes}/3`;
            } else {
                statusEl.style.color = 'var(--primary)';
                statusEl.innerText = `Inside Geofence (${match}% Match - Verified) — Red Flags: ${strikes}/3`;
            }

            document.getElementById('pinModal').style.display = 'flex';
        }

        function closePinModal() {
            document.getElementById('pinModal').style.display = 'none';
        }

        function triggerNavigation() {
            alert("Routing initiated from Your GPS Position to Student Beacon via SECE encrypted mesh network.");
            closePinModal();
        }

        function calculateSmartMatch() {
            let purpose = document.getElementById('inPurpose').value;
            if (purpose === 'Others') purpose = document.getElementById('inOtherPurpose').value || 'Custom Event';
            let zone = document.getElementById('inZone').value;
            if (zone === 'Others') zone = document.getElementById('inOtherZone').value || 'Custom Zone';

            const feedback = document.getElementById('matchFeedback');
            let score = 98;
            feedback.style.color = "var(--primary)";
            feedback.innerText = `${score}% Match — Verified Official Zone`;
            return score;
        }

        function handleODSubmit(e) {
            e.preventDefault();
            const roll = document.getElementById('inRoll').value.toUpperCase().trim();

            // Check 3-Strike Ban Ledger
            const strikeLedger = getStrikeLedger();
            const currentStrikes = strikeLedger[roll] || 0;
            if (currentStrikes >= 3) {
                alert(`❌ Application Blocked!\n\nRegister Number "${roll}" has received 3 Geofence Red Flag violations. You are barred from applying for Campus On-Duty (OD). Please contact your HOD.`);
                return;
            }

            const name = document.getElementById('inName').value;
            const year = document.getElementById('inYear').value;
            const deptSec = document.getElementById('inDept').value;
            
            let purpose = document.getElementById('inPurpose').value;
            if (purpose === 'Others') purpose = document.getElementById('inOtherPurpose').value;

            let zone = document.getElementById('inZone').value;
            if (zone === 'Others') zone = document.getElementById('inOtherZone').value;

            const slot = document.getElementById('inSlot').value;
            const score = calculateSmartMatch();
            currentStudentRoll = roll;
            isSimulatedViolation = false;

            const newEntry = {
                id: Date.now(),
                name: name,
                roll: roll,
                dept: `${deptSec} (${year})`,
                purpose: purpose,
                slot: slot,
                assignedZone: zone,
                liveLocation: zone + " (GPS Verified)",
                geofenceOk: true,
                matchScore: score,
                status: "Pending",
                strikes: currentStrikes
            };

            odRecords.unshift(newEntry);

            document.getElementById('activeStudentBox').innerHTML = `
                <div class="session-card" id="studentSessionCard">
                    <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:12px;">
                        <span class="badge badge-green" id="beaconBadge"><i class="fa-solid fa-broadcast-tower"></i> LIVE BEACON ACTIVE</span>
                        <span class="timer-display" id="liveTimer">00:00:01</span>
                    </div>
                    <h3 style="font-size:16.5px; color:#fff;">${name} (${roll}) — ${deptSec} (${year})</h3>
                    <p style="font-size:13px; color:#cbd5e1; margin:6px 0;"><strong>Purpose:</strong> ${purpose}</p>
                    <p style="font-size:13px; color:var(--primary);" id="studentLiveLocText"><strong>Current Location:</strong> ${zone} (Inside Geofence)</p>
                    
                    <div class="digital-badge">
                        <i class="fa-solid fa-qrcode" style="font-size:40px; color:var(--primary);"></i>
                        <div>
                            <div style="font-size:12px; font-weight:800; color:#fff;">SECE Secure Crypto Pass #OD-${Math.floor(100000 + Math.random() * 900000)}</div>
                            <div style="font-size:11.5px; color:var(--text-muted);">Encrypted beacon active. Scan at checkpoints.</div>
                        </div>
                    </div>
                </div>
            `;

            if (timerInterval) clearInterval(timerInterval);
            secondsElapsed = 0;
            timerInterval = setInterval(() => {
                secondsElapsed++;
                const hrs = String(Math.floor(secondsElapsed / 3600)).padStart(2, '0');
                const mins = String(Math.floor((secondsElapsed % 3600) / 60)).padStart(2, '0');
                const secs = String(secondsElapsed % 60).padStart(2, '0');
                const el = document.getElementById('liveTimer');
                if (el) el.innerText = `${hrs}:${mins}:${secs}`;
            }, 1000);

            updateMapPins();
            updateKPIs();
            alert("Official OD Request Submitted! Live telemetry tracking & cryptographic digital pass initialized.");
        }

        function simulateMovementTest() {
            if (!currentStudentRoll) {
                alert("Please submit an active OD request first to test telemetry location shifts!");
                return;
            }

            isSimulatedViolation = !isSimulatedViolation;
            const studentRec = odRecords.find(r => r.roll === currentStudentRoll);

            if (studentRec) {
                if (isSimulatedViolation) {
                    studentRec.geofenceOk = false;
                    studentRec.status = "Alert";
                    studentRec.matchScore = 38;
                    studentRec.liveLocation = "Sports Ground Canteen (Out of Zone!)";
                    document.getElementById('beaconBadge').className = "badge badge-red";
                    document.getElementById('beaconBadge').innerHTML = `<i class="fa-solid fa-triangle-exclamation"></i> GEOFENCE VIOLATION DETECTED`;
                    document.getElementById('studentSessionCard').style.borderColor = "var(--danger)";
                    document.getElementById('studentLiveLocText').style.color = "var(--danger)";
                    document.getElementById('studentLiveLocText').innerHTML = `<strong>Current Location:</strong> Sports Ground Canteen <span style="color:#fb7185;">(Match Score: 38% — Out of Zone Alert!)</span>`;
                } else {
                    studentRec.geofenceOk = true;
                    studentRec.status = "Pending";
                    studentRec.matchScore = 98;
                    studentRec.liveLocation = studentRec.assignedZone + " (GPS Verified)";
                    document.getElementById('beaconBadge').className = "badge badge-green";
                    document.getElementById('beaconBadge').innerHTML = `<i class="fa-solid fa-broadcast-tower"></i> LIVE BEACON ACTIVE`;
                    document.getElementById('studentSessionCard').style.borderColor = "var(--primary)";
                    document.getElementById('studentLiveLocText').style.color = "var(--primary)";
                    document.getElementById('studentLiveLocText').innerHTML = `<strong>Current Location:</strong> ${studentRec.assignedZone} (Inside Geofence)`;
                }
            }

            updateMapPins();
            updateKPIs();
        }

        function triggerBroadcastModal() {
            const msg = prompt("Enter institutional alert message for all active student OD beacons:", "All active OD students must verify attendance at their designated zones immediately.");
            if (msg) {
                document.getElementById('broadcastMsgText').innerText = msg;
                document.getElementById('emergencyBanner').style.display = "flex";
            }
        }

        function dismissBroadcast() {
            document.getElementById('emergencyBanner').style.display = "none";
        }

        function updateMapPins() {
            const pinsContainer = document.getElementById('mapPins');
            const controlPinsContainer = document.getElementById('controlRoomPins');

            let studentPinSvg = "";
            let controlPinSvg = "";

            document.getElementById('zone-Sports').classList.remove('alert-zone');
            document.getElementById('c-zone-Sports').classList.remove('alert-zone');

            odRecords.forEach((rec, idx) => {
                let cx = 95 + (idx * 90) % 400;
                let cy = 80 + (idx * 40) % 120;
                let color = rec.geofenceOk ? "#10b981" : "#f43f5e";

                if (!rec.geofenceOk || rec.matchScore < 50) {
                    document.getElementById('zone-Sports').classList.add('alert-zone');
                    document.getElementById('c-zone-Sports').classList.add('alert-zone');
                    cx = 440;
                    cy = 180;
                }

                const safeName = rec.name.replace(/'/g, "\\'");
                const safeZone = rec.assignedZone.replace(/'/g, "\\'");
                const safeLoc = rec.liveLocation.replace(/'/g, "\\'");

                const pinHtml = `
                    <g class="live-pin-group" onclick="openPinTelemetry('${safeName}', '${rec.roll}', '${safeZone}', '${safeLoc}', ${rec.matchScore}, '${rec.status}', ${rec.strikes})">
                        <circle cx="${cx}" cy="${cy}" r="9" fill="${color}" filter="drop-shadow(0 0 8px ${color})"></circle>
                        <circle cx="${cx}" cy="${cy}" r="4" fill="#fff"></circle>
                        <text x="${cx}" y="${cy + 20}" fill="${color}" font-size="9.5" text-anchor="middle" font-weight="bold">${rec.roll}</text>
                    </g>
                `;

                studentPinSvg += pinHtml;
                controlPinSvg += pinHtml;
            });

            if (pinsContainer) pinsContainer.innerHTML = studentPinSvg;
            if (controlPinsContainer) controlPinsContainer.innerHTML = controlPinSvg;
        }

        function renderTable() {
            const tbody = document.getElementById('odTableBody');
            const search = document.getElementById('searchInput').value.toLowerCase();
            const deptVal = document.getElementById('deptFilter').value;
            const statusVal = document.getElementById('statusFilter').value;

            tbody.innerHTML = "";

            const filtered = odRecords.filter(rec => {
                const matchSearch = rec.name.toLowerCase().includes(search) ||
                                    rec.roll.toLowerCase().includes(search) ||
                                    rec.purpose.toLowerCase().includes(search);
                const matchDept = deptVal === "ALL" || rec.dept.includes(deptVal);
                const matchStatus = statusVal === "ALL" || rec.status === statusVal;
                return matchSearch && matchDept && matchStatus;
            });

            filtered.forEach(rec => {
                let statusBadge = "";
                if (rec.matchScore < 50 || rec.status === "Alert") {
                    statusBadge = `<span class="badge badge-red"><i class="fa-solid fa-triangle-exclamation"></i> Red Flag (${rec.strikes}/3 Strikes)</span>`;
                } else if (rec.status === "Approved") {
                    statusBadge = `<span class="badge badge-green"><i class="fa-solid fa-circle-check"></i> Approved & Live</span>`;
                } else if (rec.status === "Pending") {
                    statusBadge = `<span class="badge badge-amber"><i class="fa-solid fa-clock"></i> Pending Review</span>`;
                } else {
                    statusBadge = `<span class="badge badge-red"><i class="fa-solid fa-triangle-exclamation"></i> Violation Alert</span>`;
                }

                let locBadge = rec.matchScore >= 50
                    ? `<span style="color:#34d399; font-weight:600;"><i class="fa-solid fa-location-dot"></i> ${rec.liveLocation}</span>`
                    : `<span style="color:#fb7185; font-weight:700;"><i class="fa-solid fa-triangle-exclamation"></i> ${rec.liveLocation}</span>`;

                tbody.innerHTML += `
                    <tr>
                        <td>
                            <strong>${rec.name}</strong><br>
                            <span style="font-size:11.5px; color:var(--text-muted);">${rec.roll} • ${rec.dept}</span>
                        </td>
                        <td>
                            <strong>${rec.purpose}</strong><br>
                            <span style="font-size:11.5px; color:var(--text-muted);">${rec.slot}</span>
                        </td>
                        <td>${rec.assignedZone}</td>
                        <td>${locBadge}</td>
                        <td><strong style="color: ${rec.matchScore < 50 ? 'var(--danger)' : 'var(--primary)'};">${rec.matchScore}%</strong></td>
                        <td>${statusBadge}</td>
                        <td>
                            <div style="display:flex; gap:8px; flex-wrap:wrap;">
                                <button class="btn-act act-approve" onclick="updateStatus(${rec.id}, 'Approved')">Approve</button>
                                <button class="btn-act act-reject" onclick="issueRedFlag(${rec.id})">Red Flag 🚩</button>
                                <button class="btn-act act-ping" onclick="pingStudent('${rec.name}', '${rec.roll}')"><i class="fa-solid fa-bell"></i></button>
                            </div>
                        </td>
                    </tr>
                `;
            });
            updateKPIs();
        }

        // Faculty Action: Issue Red Flag (Increments strike count)
        function issueRedFlag(id) {
            const record = odRecords.find(r => r.id === id);
            if (record) {
                record.status = "Alert";
                record.geofenceOk = false;
                record.matchScore = 30;
                record.strikes = (record.strikes || 0) + 1;

                // Update permanent strike ledger in localStorage
                const strikeLedger = getStrikeLedger();
                strikeLedger[record.roll] = record.strikes;
                saveStrikeLedger(strikeLedger);

                renderTable();
                updateMapPins();

                if (record.strikes >= 3) {
                    alert(`🚨 BAN ENFORCED!\n\nStudent ${record.name} (${record.roll}) has reached 3 Red Flag strikes. Their register number is now locked and they cannot apply for OD anymore.`);
                } else {
                    alert(`⚠️ Red Flag issued to ${record.name} (${record.roll}). Current Strikes: ${record.strikes}/3`);
                }
            }
        }

        function updateStatus(id, newStatus) {
            const record = odRecords.find(r => r.id === id);
            if (record) {
                record.status = newStatus;
                if (newStatus === 'Approved') {
                    record.geofenceOk = true;
                    record.matchScore = 95;
                }
                renderTable();
                updateMapPins();
            }
        }

        function pingStudent(name, roll) {
            alert(`Live Location Verification Ping sent to ${name} (${roll})'s mobile device!`);
        }

        function updateKPIs() {
            document.getElementById('kpiActive').innerText = odRecords.length;
            document.getElementById('kpiPending').innerText = odRecords.filter(r => r.status === 'Pending').length;
            document.getElementById('kpiAlerts').innerText = odRecords.filter(r => r.status === 'Alert' || !r.geofenceOk || r.matchScore < 50).length;
        }

        function exportCSVReport() {
            let csv = "Roll No,Student Name,Department,Purpose,Assigned Zone,Live Location,Match Score,Strikes,Status\n";
            odRecords.forEach(r => {
                csv += `"${r.roll}","${r.name}","${r.dept}","${r.purpose}","${r.assignedZone}","${r.liveLocation}","${r.matchScore}%","${r.strikes}","${r.status}"\n`;
            });
            const blob = new Blob([csv], { type: 'text/csv' });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = "SECE_Official_Campus_OD_Report.csv";
            a.click();
        }

        renderTable();
        updateMapPins();
