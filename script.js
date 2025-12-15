// Barcode Generator Application
class BarcodeGenerator {
    constructor() {
        this.currentBarcode = null;
        this.currentFormat = 'svg';
        this.history = [];
        this.init();
    }

    init() {
        this.setupEventListeners();
        this.loadSettings();
        this.updateCharCount();
        this.loadHistory();
    }

    setupEventListeners() {
        // Generate button
        document.getElementById('generateBtn').addEventListener('click', () => this.generateBarcode());
        
        // Clear button
        document.getElementById('clearBtn').addEventListener('click', () => this.clearForm());
        
        // Barcode type change
        document.getElementById('barcodeType').addEventListener('change', () => this.validateInput());
        
        // Data input
        document.getElementById('barcodeData').addEventListener('input', () => {
            this.updateCharCount();
            this.validateInput();
        });
        
        // Format buttons
        document.querySelectorAll('.format-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                this.selectFormat(e.target.closest('.format-btn').dataset.format);
            });
        });
        
        // Sliders
        document.getElementById('barcodeWidth').addEventListener('input', (e) => {
            document.getElementById('widthValue').textContent = e.target.value;
        });
        
        document.getElementById('barcodeHeight').addEventListener('input', (e) => {
            document.getElementById('heightValue').textContent = e.target.value;
        });
        
        document.getElementById('fontSize').addEventListener('input', (e) => {
            document.getElementById('fontSizeValue').textContent = e.target.value;
        });
        
        // Export buttons
        document.getElementById('downloadPng').addEventListener('click', () => this.downloadBarcode('png'));
        document.getElementById('downloadSvg').addEventListener('click', () => this.downloadBarcode('svg'));
        document.getElementById('downloadPdf').addEventListener('click', () => this.downloadBarcode('pdf'));
        document.getElementById('copyToClipboard').addEventListener('click', () => this.copyToClipboard());
        document.getElementById('printBarcode').addEventListener('click', () => this.printBarcode());
        
        // Batch operations
        document.getElementById('batchGenerateBtn').addEventListener('click', () => this.openBatchModal());
        document.getElementById('importCsvBtn').addEventListener('click', () => this.importCSV());
        document.getElementById('exportAllBtn').addEventListener('click', () => this.exportAll());
        
        // Theme toggle
        document.getElementById('themeToggle').addEventListener('click', () => this.toggleTheme());
        
        // Help button
        document.getElementById('helpBtn').addEventListener('click', () => this.openHelpModal());
        
        // Modal controls
        document.getElementById('closeBatchModal').addEventListener('click', () => this.closeBatchModal());
        document.getElementById('cancelBatchBtn').addEventListener('click', () => this.closeBatchModal());
        document.getElementById('startBatchBtn').addEventListener('click', () => this.startBatchGeneration());
        
        document.getElementById('closeHelpModal').addEventListener('click', () => this.closeHelpModal());
        
        // Batch data input
        document.getElementById('batchData').addEventListener('input', (e) => {
            const lines = e.target.value.split('\n').filter(line => line.trim());
            document.getElementById('batchCountDisplay').textContent = lines.length;
        });
        
        // Keyboard shortcuts
        document.addEventListener('keydown', (e) => {
            if (e.ctrlKey && e.key === 'Enter') {
                e.preventDefault();
                this.generateBarcode();
            } else if (e.ctrlKey && e.key === 's') {
                e.preventDefault();
                if (this.currentBarcode) {
                    this.downloadBarcode('png');
                }
            } else if (e.ctrlKey && e.key === 'p') {
                e.preventDefault();
                if (this.currentBarcode) {
                    this.printBarcode();
                }
            } else if (e.key === 'Escape') {
                this.closeAllModals();
            }
        });
        
        // Click outside modal to close
        document.querySelectorAll('.modal').forEach(modal => {
            modal.addEventListener('click', (e) => {
                if (e.target === modal) {
                    modal.classList.remove('active');
                }
            });
        });
    }

    generateBarcode() {
        const type = document.getElementById('barcodeType').value;
        const data = document.getElementById('barcodeData').value.trim();
        
        if (!data) {
            this.showToast('لطفاً داده بارکد را وارد کنید', 'warning');
            return;
        }
        
        if (!this.validateBarcodeData(type, data)) {
            return;
        }
        
        const options = this.getBarcodeOptions();
        const display = document.getElementById('barcodeDisplay');
        
        try {
            if (type === 'qrcode') {
                this.generateQRCode(data, display);
            } else {
                this.generateStandardBarcode(type, data, options, display);
            }
            
            this.currentBarcode = { type, data, options };
            this.addToHistory(type, data);
            this.showToast('بارکد با موفقیت تولید شد', 'success');
            
        } catch (error) {
            console.error('Barcode generation error:', error);
            this.showToast('خطا در تولید بارکد: ' + error.message, 'error');
        }
    }

    generateStandardBarcode(type, data, options, display) {
        display.innerHTML = '';
        
        if (this.currentFormat === 'svg') {
            const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
            svg.setAttribute('id', 'barcode');
            display.appendChild(svg);
            
            JsBarcode(svg, data, {
                format: type,
                ...options,
                xmlDocument: document
            });
        } else {
            const canvas = document.createElement('canvas');
            canvas.id = 'barcode';
            display.appendChild(canvas);
            
            JsBarcode(canvas, data, {
                format: type,
                ...options
            });
        }
    }

    generateQRCode(data, display) {
        display.innerHTML = '';
        
        const size = parseInt(document.getElementById('barcodeHeight').value) * 3;
        const qrContainer = document.createElement('div');
        qrContainer.style.textAlign = 'center';
        display.appendChild(qrContainer);
        
        new QRCode(qrContainer, {
            text: data,
            width: size,
            height: size,
            colorDark: document.getElementById('lineColor').value,
            colorLight: document.getElementById('backgroundColor').value,
            correctLevel: QRCode.CorrectLevel.H
        });
    }

    getBarcodeOptions() {
        return {
            width: parseFloat(document.getElementById('barcodeWidth').value),
            height: parseInt(document.getElementById('barcodeHeight').value),
            displayValue: document.getElementById('displayValue').checked,
            fontSize: parseInt(document.getElementById('fontSize').value),
            lineColor: document.getElementById('lineColor').value,
            background: document.getElementById('backgroundColor').value,
            margin: document.getElementById('margin').checked ? 10 : 0
        };
    }

    validateBarcodeData(type, data) {
        switch (type) {
            case 'EAN13':
                if (!/^\d{12,13}$/.test(data)) {
                    this.showToast('EAN-13 باید 12 یا 13 رقم عددی باشد', 'error');
                    return false;
                }
                break;
            case 'EAN8':
                if (!/^\d{7,8}$/.test(data)) {
                    this.showToast('EAN-8 باید 7 یا 8 رقم عددی باشد', 'error');
                    return false;
                }
                break;
            case 'UPC':
                if (!/^\d{11,12}$/.test(data)) {
                    this.showToast('UPC-A باید 11 یا 12 رقم عددی باشد', 'error');
                    return false;
                }
                break;
            case 'ITF14':
                if (!/^\d{13,14}$/.test(data)) {
                    this.showToast('ITF-14 باید 13 یا 14 رقم عددی باشد', 'error');
                    return false;
                }
                break;
            case 'CODE39':
                if (!/^[A-Z0-9\-\.\ \$\/\+\%]+$/.test(data.toUpperCase())) {
                    this.showToast('Code-39 فقط حروف انگلیسی بزرگ، اعداد و نمادهای خاص را پشتیبانی می‌کند', 'error');
                    return false;
                }
                break;
        }
        return true;
    }

    validateInput() {
        const type = document.getElementById('barcodeType').value;
        const data = document.getElementById('barcodeData').value;
        const input = document.getElementById('barcodeData');
        
        if (data && !this.validateBarcodeData(type, data)) {
            input.style.borderColor = 'var(--error-color)';
        } else {
            input.style.borderColor = '';
        }
    }

    updateCharCount() {
        const data = document.getElementById('barcodeData').value;
        document.getElementById('charCount').textContent = data.length;
    }

    selectFormat(format) {
        this.currentFormat = format;
        document.querySelectorAll('.format-btn').forEach(btn => {
            btn.classList.remove('active');
        });
        document.querySelector(`[data-format="${format}"]`).classList.add('active');
        
        if (this.currentBarcode) {
            this.generateBarcode();
        }
    }

    downloadBarcode(format) {
        if (!this.currentBarcode) {
            this.showToast('ابتدا یک بارکد تولید کنید', 'warning');
            return;
        }
        
        const { data } = this.currentBarcode;
        const timestamp = new Date().toISOString().slice(0, 19).replace(/:/g, '-');
        
        try {
            switch (format) {
                case 'png':
                    this.downloadPNG(`barcode-${timestamp}.png`);
                    break;
                case 'svg':
                    this.downloadSVG(`barcode-${timestamp}.svg`);
                    break;
                case 'pdf':
                    this.downloadPDF(`barcode-${timestamp}.pdf`);
                    break;
            }
            this.showToast(`بارکد با فرمت ${format.toUpperCase()} ذخیره شد`, 'success');
        } catch (error) {
            console.error('Download error:', error);
            this.showToast('خطا در ذخیره فایل', 'error');
        }
    }

    downloadPNG(filename) {
        const canvas = document.querySelector('#barcodeDisplay canvas') || 
                      this.createCanvasFromSVG();
        
        const link = document.createElement('a');
        link.download = filename;
        link.href = canvas.toDataURL();
        link.click();
    }

    downloadSVG(filename) {
        const svg = document.querySelector('#barcodeDisplay svg');
        if (!svg) {
            this.showToast('برای دانلود SVG، ابتدا فرمت را به SVG تغییر دهید', 'warning');
            return;
        }
        
        const svgData = new XMLSerializer().serializeToString(svg);
        const svgBlob = new Blob([svgData], { type: 'image/svg+xml;charset=utf-8' });
        const svgUrl = URL.createObjectURL(svgBlob);
        
        const link = document.createElement('a');
        link.download = filename;
        link.href = svgUrl;
        link.click();
        
        URL.revokeObjectURL(svgUrl);
    }

    downloadPDF(filename) {
        const { jsPDF } = window.jspdf;
        const pdf = new jsPDF();
        
        const canvas = document.querySelector('#barcodeDisplay canvas') || 
                      this.createCanvasFromSVG();
        
        const imgData = canvas.toDataURL('image/png');
        const imgWidth = canvas.width;
        const imgHeight = canvas.height;
        
        const pdfWidth = pdf.internal.pageSize.getWidth();
        const pdfHeight = (imgHeight * pdfWidth) / imgWidth;
        
        pdf.addImage(imgData, 'PNG', 10, 10, pdfWidth - 20, pdfHeight);
        pdf.save(filename);
    }

    createCanvasFromSVG() {
        const svg = document.querySelector('#barcodeDisplay svg');
        if (!svg) return null;
        
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        const svgData = new XMLSerializer().serializeToString(svg);
        const img = new Image();
        
        canvas.width = svg.getAttribute('width') || 300;
        canvas.height = svg.getAttribute('height') || 100;
        
        img.onload = () => {
            ctx.fillStyle = '#FFFFFF';
            ctx.fillRect(0, 0, canvas.width, canvas.height);
            ctx.drawImage(img, 0, 0);
        };
        
        img.src = 'data:image/svg+xml;base64,' + btoa(svgData);
        return canvas;
    }

    copyToClipboard() {
        if (!this.currentBarcode) {
            this.showToast('ابتدا یک بارکد تولید کنید', 'warning');
            return;
        }
        
        const canvas = document.querySelector('#barcodeDisplay canvas') || 
                      this.createCanvasFromSVG();
        
        if (!canvas) {
            this.showToast('عدم توانایی در کپی بارکد', 'error');
            return;
        }
        
        canvas.toBlob((blob) => {
            const item = new ClipboardItem({ 'image/png': blob });
            navigator.clipboard.write([item]).then(() => {
                this.showToast('بارکد به کلیپ‌بورد کپی شد', 'success');
            }).catch(() => {
                this.showToast('خطا در کپی بارکد', 'error');
            });
        });
    }

    printBarcode() {
        if (!this.currentBarcode) {
            this.showToast('ابتدا یک بارکد تولید کنید', 'warning');
            return;
        }
        
        const printWindow = window.open('', '_blank');
        const barcodeHTML = document.getElementById('barcodeDisplay').innerHTML;
        
        printWindow.document.write(`
            <!DOCTYPE html>
            <html dir="rtl">
            <head>
                <meta charset="UTF-8">
                <title>Print Barcode</title>
                <style>
                    body { 
                        margin: 0; 
                        padding: 20px; 
                        text-align: center; 
                        font-family: Arial, sans-serif;
                    }
                    .barcode { 
                        display: inline-block; 
                        padding: 20px; 
                        border: 1px solid #ccc; 
                    }
                    @media print {
                        body { margin: 0; }
                    }
                </style>
            </head>
            <body>
                <div class="barcode">${barcodeHTML}</div>
            </body>
            </html>
        `);
        
        printWindow.document.close();
        printWindow.onload = () => {
            printWindow.print();
            printWindow.close();
        };
    }

    openBatchModal() {
        document.getElementById('batchModal').classList.add('active');
    }

    closeBatchModal() {
        document.getElementById('batchModal').classList.remove('active');
        document.getElementById('batchData').value = '';
        document.getElementById('batchCountDisplay').textContent = '0';
    }

    startBatchGeneration() {
        const batchData = document.getElementById('batchData').value.trim();
        if (!batchData) {
            this.showToast('لطفاً داده‌ها را وارد کنید', 'warning');
            return;
        }
        
        const lines = batchData.split('\n').filter(line => line.trim());
        const type = document.getElementById('barcodeType').value;
        
        this.showToast(`در حال تولید ${lines.length} بارکد...`, 'info');
        
        const zip = new JSZip();
        const batchFolder = zip.folder(`batch-barcodes-${Date.now()}`);
        
        let completed = 0;
        const total = lines.length;
        
        lines.forEach((data, index) => {
            setTimeout(() => {
                if (this.validateBarcodeData(type, data)) {
                    const tempData = document.getElementById('barcodeData').value;
                    document.getElementById('barcodeData').value = data;
                    this.generateBarcode();
                    
                    setTimeout(() => {
                        const canvas = document.querySelector('#barcodeDisplay canvas') || 
                                      this.createCanvasFromSVG();
                        
                        if (canvas) {
                            const imageData = canvas.toDataURL('image/png').split(',')[1];
                            batchFolder.file(`barcode-${index + 1}.png`, imageData, { base64: true });
                        }
                        
                        completed++;
                        if (completed === total) {
                            this.generateBatchZip(zip);
                            document.getElementById('barcodeData').value = tempData;
                            this.closeBatchModal();
                        }
                    }, 500);
                } else {
                    completed++;
                    if (completed === total) {
                        this.generateBatchZip(zip);
                        this.closeBatchModal();
                    }
                }
            }, index * 100);
        });
    }

    generateBatchZip(zip) {
        zip.generateAsync({ type: 'blob' }).then((content) => {
            const link = document.createElement('a');
            link.href = URL.createObjectURL(content);
            link.download = `batch-barcodes-${Date.now()}.zip`;
            link.click();
            this.showToast('فایل ZIP با موفقیت ایجاد شد', 'success');
        });
    }

    importCSV() {
        const input = document.createElement('input');
        input.type = 'file';
        input.accept = '.csv,.txt';
        
        input.onchange = (e) => {
            const file = e.target.files[0];
            if (!file) return;
            
            const reader = new FileReader();
            reader.onload = (event) => {
                const data = event.target.result;
                document.getElementById('batchData').value = data;
                this.openBatchModal();
                
                const lines = data.split('\n').filter(line => line.trim());
                document.getElementById('batchCountDisplay').textContent = lines.length;
            };
            reader.readAsText(file);
        };
        
        input.click();
    }

    exportAll() {
        if (this.history.length === 0) {
            this.showToast('هیچ تاریخچه‌ای برای خروجی وجود ندارد', 'warning');
            return;
        }
        
        const csvContent = this.history.map(item => 
            `${item.type},${item.data},${item.timestamp}`
        ).join('\n');
        
        const blob = new Blob(['Type,Data,Timestamp\n' + csvContent], 
                             { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement('a');
        link.href = URL.createObjectURL(blob);
        link.download = `barcode-history-${Date.now()}.csv`;
        link.click();
        
        this.showToast('تاریخچه با موفقیت خروجی گرفت', 'success');
    }

    addToHistory(type, data) {
        const historyItem = {
            id: Date.now(),
            type,
            data,
            timestamp: new Date().toLocaleString('fa-IR')
        };
        
        this.history.unshift(historyItem);
        if (this.history.length > 20) {
            this.history = this.history.slice(0, 20);
        }
        
        this.saveHistory();
        this.renderHistory();
    }

    renderHistory() {
        const historyList = document.getElementById('historyList');
        
        if (this.history.length === 0) {
            historyList.innerHTML = '<p class="no-history">هیچ بارکدی تولید نشده است</p>';
            return;
        }
        
        historyList.innerHTML = this.history.map(item => `
            <div class="history-item">
                <div class="history-info">
                    <div class="history-type">${item.type}</div>
                    <div class="history-data">${item.data}</div>
                    <div class="history-time">${item.timestamp}</div>
                </div>
                <div class="history-actions">
                    <button class="history-action-btn" onclick="barcodeGen.regenerateHistory('${item.id}')">
                        <i class="fas fa-redo"></i>
                    </button>
                    <button class="history-action-btn" onclick="barcodeGen.deleteFromHistory('${item.id}')">
                        <i class="fas fa-trash"></i>
                    </button>
                </div>
            </div>
        `).join('');
    }

    regenerateHistory(id) {
        const item = this.history.find(h => h.id == id);
        if (item) {
            document.getElementById('barcodeType').value = item.type;
            document.getElementById('barcodeData').value = item.data;
            this.updateCharCount();
            this.generateBarcode();
        }
    }

    deleteFromHistory(id) {
        this.history = this.history.filter(h => h.id != id);
        this.saveHistory();
        this.renderHistory();
        this.showToast('از تاریخچه حذف شد', 'info');
    }

    saveHistory() {
        try {
            localStorage.setItem('barcodeHistory', JSON.stringify(this.history));
        } catch (e) {
            console.error('Failed to save history:', e);
        }
    }

    loadHistory() {
        try {
            const saved = localStorage.getItem('barcodeHistory');
            if (saved) {
                this.history = JSON.parse(saved);
                this.renderHistory();
            }
        } catch (e) {
            console.error('Failed to load history:', e);
        }
    }

    clearForm() {
        document.getElementById('barcodeData').value = '';
        document.getElementById('barcodeDisplay').innerHTML = `
            <div class="placeholder">
                <i class="fas fa-barcode"></i>
                <p>بارکد شما اینجا نمایش داده خواهد شد</p>
            </div>
        `;
        this.currentBarcode = null;
        this.updateCharCount();
        this.showToast('فرم پاک شد', 'info');
    }

    toggleTheme() {
        const body = document.body;
        const themeToggle = document.getElementById('themeToggle');
        
        body.classList.toggle('dark-theme');
        
        if (body.classList.contains('dark-theme')) {
            themeToggle.innerHTML = '<i class="fas fa-sun"></i>';
            localStorage.setItem('theme', 'dark');
        } else {
            themeToggle.innerHTML = '<i class="fas fa-moon"></i>';
            localStorage.setItem('theme', 'light');
        }
    }

    loadSettings() {
        const theme = localStorage.getItem('theme');
        if (theme === 'dark') {
            document.body.classList.add('dark-theme');
            document.getElementById('themeToggle').innerHTML = '<i class="fas fa-sun"></i>';
        }
    }

    openHelpModal() {
        document.getElementById('helpModal').classList.add('active');
    }

    closeHelpModal() {
        document.getElementById('helpModal').classList.remove('active');
    }

    closeAllModals() {
        document.querySelectorAll('.modal').forEach(modal => {
            modal.classList.remove('active');
        });
    }

    showToast(message, type = 'info') {
        const toastContainer = document.getElementById('toastContainer');
        
        const toast = document.createElement('div');
        toast.className = `toast ${type}`;
        
        const icons = {
            success: 'fa-check-circle',
            error: 'fa-exclamation-circle',
            warning: 'fa-exclamation-triangle',
            info: 'fa-info-circle'
        };
        
        toast.innerHTML = `
            <i class="fas ${icons[type]} toast-icon"></i>
            <span class="toast-message">${message}</span>
            <button class="toast-close">
                <i class="fas fa-times"></i>
            </button>
        `;
        
        toastContainer.appendChild(toast);
        
        const closeBtn = toast.querySelector('.toast-close');
        closeBtn.addEventListener('click', () => {
            toast.remove();
        });
        
        setTimeout(() => {
            toast.remove();
        }, 5000);
    }
}

// Initialize the application
const barcodeGen = new BarcodeGenerator();

// Load JSZip library for batch operations
const script = document.createElement('script');
script.src = 'https://cdnjs.cloudflare.com/ajax/libs/jszip/3.10.1/jszip.min.js';
document.head.appendChild(script);