document.addEventListener('DOMContentLoaded', function() {
    console.log('DOMContentLoaded event fired.'); // Log 1

    // --- Element References ---
    const startBtn = document.getElementById('start-btn');
    console.log('startBtn found:', !!startBtn); // Log 2a
    const stopBtn = document.getElementById('stop-btn');
    console.log('stopBtn found:', !!stopBtn); // Log 2b
    const logBtn = document.getElementById('log-btn');
    console.log('logBtn found:', !!logBtn); // Log 2c
    const reporterInput = document.getElementById('reporter'); // Use input field ID
    console.log('reporterInput found:', !!reporterInput); // Log 2d
    const shipNameInput = document.getElementById('ship-name'); // Use input field ID
    console.log('shipNameInput found:', !!shipNameInput); // Log 2e
    const transcriptTextarea = document.getElementById('transcript');
    console.log('transcriptTextarea found:', !!transcriptTextarea); // Log 2f
    const statusP = document.getElementById('status');
    console.log('statusP found:', !!statusP); // Log 2g
    const logTableBody = document.querySelector('#log-table tbody');
    console.log('logTableBody found:', !!logTableBody); // Log 2h
    const exportBtn = document.getElementById('export-btn'); // Get export button
    console.log('exportBtn found:', !!exportBtn); // Log export button

    // --- Dummy Data ---
    const reporters = ['田中 太郎', '山田 花子', '佐藤 次郎', '鈴木 三郎'];
    const shipNames = ['第123号船', '第456号船', '第789号船', '第000号船'];

    // --- Populate Select Function ---
    function populateSelect(selectElement, options) {
        if (!selectElement) return; // Add guard clause
        // Clear existing options first (optional, but good practice)
        // selectElement.innerHTML = '';
        options.forEach(option => {
            const opt = document.createElement('option');
            opt.value = option;
            opt.textContent = option;
            selectElement.appendChild(opt);
        });
    }

    // --- Initial Setup ---
    populateSelect(reporterInput, reporters); // Populate reporter dropdown
    populateSelect(shipNameInput, shipNames); // Populate ship name dropdown
    console.log('Dropdowns populated.'); // Log dropdown population

    // Check if logBtn was actually found before proceeding
    if (!logBtn) {
        console.error("CRITICAL: logBtn element not found. Cannot attach listener.");
        return; // Stop execution if the critical button is missing
    }

    // --- Web Speech API Setup ---
    let recognition;
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    console.log('SpeechRecognition API available:', !!SpeechRecognition); // Log 3
    let finalTranscript = ''; // Declare finalTranscript here, outside event handlers

    if (SpeechRecognition) {
        recognition = new SpeechRecognition();
        recognition.lang = 'ja-JP';
        recognition.interimResults = true; // Show results while speaking
        recognition.continuous = true; // Keep listening until stopped

        // --- Recognition Event Handlers ---
        recognition.onstart = function() {
            statusP.textContent = '音声認識中...';
            startBtn.disabled = true;
            stopBtn.disabled = false;
        };

        recognition.onresult = function(event) {
            let interimTranscript = '';
            // DO NOT reset finalTranscript = ''; here

            for (let i = event.resultIndex; i < event.results.length; ++i) {
                const transcriptPart = event.results[i][0].transcript;
                if (event.results[i].isFinal) {
                    finalTranscript += transcriptPart; // Append final parts
                } else {
                    interimTranscript += transcriptPart; // Collect current interim parts
                }
            }
            // Update textarea with accumulated final transcript + current interim transcript
            transcriptTextarea.value = finalTranscript + interimTranscript;
            console.log('onresult - Accumulated Final:', finalTranscript, 'Current Interim:', interimTranscript); // Updated log
        };

        recognition.onerror = function(event) {
            statusP.textContent = 'エラー: ' + event.error;
            console.error('Speech recognition error:', event.error);
            stopRecognition(); // Ensure buttons reset on error
        };

        recognition.onend = function() {
            console.log('Recognition ended.');
            statusP.textContent = '待機中...'; // Keep '待機中...' on auto-end
            startBtn.disabled = false;
            stopBtn.disabled = true;
            // Ensure the final transcript is displayed without any lingering interim results
            transcriptTextarea.value = finalTranscript;
            console.log('onend - Final transcript displayed:', finalTranscript);
        };

        // --- Control Functions ---
        function startRecognition() {
            if (recognition) {
                finalTranscript = ''; // Reset here is correct for a new session
                transcriptTextarea.value = ''; // Clear the textarea
                try {
                    recognition.start();
                } catch (e) {
                    console.error('Error starting recognition:', e);
                    statusP.textContent = 'エラー: 認識を開始できません。';
                }
                console.log('Recognition started.');
            }
        }

        function stopRecognition() {
            if (recognition) {
                try {
                    recognition.stop();
                    console.log('Recognition stopped by user.');
                    // Optional: Update textarea with final transcript just before 'onend' fires
                    // transcriptTextarea.value = finalTranscript;
                } catch (e) {
                    // Handle potential errors if recognition wasn't running
                    console.warn('Error stopping recognition (may already be stopped):', e);
                }
            }
            // Button states are handled in onend
        }

        // --- Button Event Listeners ---
        startBtn.addEventListener('click', startRecognition);
        stopBtn.addEventListener('click', stopRecognition);

        console.log('Adding event listener to logBtn...'); // Log 4
        logBtn.addEventListener('click', function() {
            console.log('Log button clicked!'); // The only line inside for now

            // Restore input retrieval and validation
            const reporter = reporterInput.value.trim();
            const shipName = shipNameInput.value.trim();
            const transcript = transcriptTextarea.value.trim();

            // Input validation
            if (!reporter || !shipName || !transcript) {
                alert('報告者、番船名、報告内容をすべて入力または音声入力してください。');
                return; // Stop if validation fails
            }

            console.log('Inputs validated:', reporter, shipName, transcript); // Add log after validation

            // Get current date and time
            const now = new Date();
            const formattedDate = `${now.getFullYear()}/${(now.getMonth() + 1).toString().padStart(2, '0')}/${now.getDate().toString().padStart(2, '0')} ${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`;

            // Add row to table
            const newRow = logTableBody.insertRow();
            console.log('New row created:', newRow); // Log row creation
            const cell1 = newRow.insertCell(); // 日時
            const cell2 = newRow.insertCell(); // 報告者
            const cell3 = newRow.insertCell(); // 番船名
            const cell4 = newRow.insertCell(); // 報告内容

            cell1.textContent = formattedDate;
            cell1.setAttribute('data-label', '日時');
            cell2.textContent = reporter;
            cell2.setAttribute('data-label', '報告者');
            cell3.textContent = shipName;
            cell3.setAttribute('data-label', '番船名');
            cell4.textContent = transcript;
            cell4.setAttribute('data-label', '報告内容');

            console.log('Cells 1-4 populated.'); // Log cell population

            const cell5 = newRow.insertCell(); // 操作

            // Create and add delete button
            const deleteBtn = document.createElement('button');
            deleteBtn.textContent = '削除';
            deleteBtn.classList.add('delete-btn');
            deleteBtn.addEventListener('click', function() {
                // Remove the parent row (tr) when clicked
                this.closest('tr').remove();
            });
            cell5.appendChild(deleteBtn);
            cell5.setAttribute('data-label', '操作');
            console.log('Delete button added to row.'); // Log delete button addition

            // Restore final steps: clear transcript and update status
            transcriptTextarea.value = '';
            statusP.textContent = '記録しました。';
            setTimeout(() => {
                if (statusP.textContent === '記録しました。') { // Avoid overwriting error messages
                    statusP.textContent = '待機中...';
                }
            }, 2000);
        });

        // --- CSV Export Function ---
        function escapeCSV(value) {
            // If the value contains a comma, double quote, or newline, enclose it in double quotes
            // and double up any existing double quotes inside the value.
            if (value.includes(',') || value.includes('"') || value.includes('\n')) {
                return `"${value.replace(/"/g, '""')}"`;
            }
            return value;
        }

        function exportTableToCSV() {
            console.log('Export button clicked');
            const rows = logTableBody.querySelectorAll('tr');
            if (rows.length === 0) {
                alert('エクスポートするデータがありません。');
                return;
            }

            // Add UTF-8 BOM for Excel compatibility
            let csvContent = "\uFEFF"; // Start with BOM
            // Header Row
            const headerCells = document.querySelectorAll('#log-table thead th');
            let headerRow = [];
            headerCells.forEach((header, index) => {
                // Skip the last header ('操作') for data export
                if (index < headerCells.length - 1) { 
                    headerRow.push(escapeCSV(header.textContent));
                }
            });
            csvContent += headerRow.join(",") + "\r\n";

            // Data Rows
            rows.forEach(row => {
                const cells = row.querySelectorAll('td');
                let rowData = [];
                cells.forEach((cell, index) => {
                    // Skip the last cell (delete button)
                    if (index < cells.length - 1) { 
                        rowData.push(escapeCSV(cell.textContent));
                    }
                });
                csvContent += rowData.join(",") + "\r\n";
            });

            // Create download link
            const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' }); // Create a Blob
            const url = URL.createObjectURL(blob); // Create an object URL from the Blob

            const link = document.createElement("a");
            link.setAttribute("href", url);
            link.setAttribute("download", "ship_report_log.csv");
            document.body.appendChild(link); // Required for Firefox

            link.click(); // Trigger download

            document.body.removeChild(link); // Clean up
            URL.revokeObjectURL(url); // Release the object URL
            console.log('CSV export triggered with BOM.');
        }

        // Add event listener for export button
        if (exportBtn) {
            exportBtn.addEventListener('click', exportTableToCSV);
            console.log('Event listener added to exportBtn.');
        } else {
            console.error('Export button not found, cannot add listener.');
        }

    } else {
        // Speech Recognition not supported
        console.warn('Speech Recognition not supported by this browser.'); // Log 5
        statusP.textContent = 'お使いのブラウザは音声認識に対応していません。';
        startBtn.disabled = true;
        stopBtn.disabled = true;
        logBtn.disabled = true;
        alert('Web Speech APIはこのブラウザではサポートされていません。Chromeの使用を推奨します。');
    }

}); // End of DOMContentLoaded
