// FFmpeg App Implementation using FFmpeg v0.11.6 (Single-Thread, Compatible with GitHub Pages)
const { createFFmpeg, fetchFile } = FFmpeg;

let ffmpeg = null;
let selectedFile = null;

// Supported format configurations
const FORMAT_OPTIONS = {
    video: [
        { label: 'MP4 (H.264 Video / AAC Audio)', value: 'mp4', ext: 'mp4' },
        { label: 'GIF (Imagem Animada)', value: 'gif', ext: 'gif' },
        { label: 'WEBM (Web Video)', value: 'webm', ext: 'webm' },
        { label: 'AVI (Video)', value: 'avi', ext: 'avi' },
        { label: 'MKV (Matroska Video)', value: 'mkv', ext: 'mkv' },
        { label: 'Extrair Áudio (MP3)', value: 'mp3', ext: 'mp3' },
        { label: 'Extrair Áudio (WAV)', value: 'wav', ext: 'wav' }
    ],
    audio: [
        { label: 'MP3 (Áudio Compactado)', value: 'mp3', ext: 'mp3' },
        { label: 'WAV (Sem Compressão)', value: 'wav', ext: 'wav' },
        { label: 'AAC (M4A Áudio)', value: 'aac', ext: 'aac' },
        { label: 'OGG (Vorbis Áudio)', value: 'ogg', ext: 'ogg' },
        { label: 'FLAC (Áudio Sem Perda)', value: 'flac', ext: 'flac' }
    ],
    image: [
        { label: 'PNG (Alta Qualidade)', value: 'png', ext: 'png' },
        { label: 'JPG / JPEG (Fotografia)', value: 'jpg', ext: 'jpg' },
        { label: 'WEBP (Otimizado para Web)', value: 'webp', ext: 'webp' },
        { label: 'GIF (Imagem)', value: 'gif', ext: 'gif' }
    ]
};

// DOM Elements
const dropZone = document.getElementById('dropZone');
const fileInput = document.getElementById('fileInput');
const fileInfo = document.getElementById('fileInfo');
const fileName = document.getElementById('fileName');
const fileSize = document.getElementById('fileSize');
const fileIcon = document.getElementById('fileIcon');
const removeFileBtn = document.getElementById('removeFileBtn');

const optionsSection = document.getElementById('optionsSection');
const outputFormatSelect = document.getElementById('outputFormat');
const presetGroup = document.getElementById('presetGroup');
const convertBtn = document.getElementById('convertBtn');
const btnText = document.getElementById('btnText');

const progressSection = document.getElementById('progressSection');
const progressStatus = document.getElementById('progressStatus');
const progressPercent = document.getElementById('progressPercent');
const progressBar = document.getElementById('progressBar');
const logBox = document.getElementById('logBox');

const resultSection = document.getElementById('resultSection');
const downloadBtn = document.getElementById('downloadBtn');
const resetBtn = document.getElementById('resetBtn');

const statusBadge = document.getElementById('statusBadge');
const statusText = document.getElementById('statusText');

// Initialize FFmpeg
async function initFFmpeg() {
    try {
        ffmpeg = createFFmpeg({
            log: true,
            corePath: 'https://unpkg.com/@ffmpeg/core@0.11.0/dist/ffmpeg-core.js'
        });

        ffmpeg.setProgress(({ ratio }) => {
            const pct = Math.max(0, Math.min(100, Math.round(ratio * 100)));
            if (!isNaN(pct)) {
                progressPercent.innerText = `${pct}%`;
                progressBar.style.width = `${pct}%`;
            }
        });

        ffmpeg.setLogger(({ type, message }) => {
            appendLog(message, type);
        });

        await ffmpeg.load();

        statusBadge.className = 'status-badge ready';
        statusText.innerText = 'FFmpeg Pronto';
        if (selectedFile) convertBtn.disabled = false;
    } catch (err) {
        console.error("Erro ao carregar FFmpeg:", err);
        statusBadge.className = 'status-badge error';
        statusText.innerText = 'Erro ao Carregar Engine';
        appendLog(`Erro crítico de carregamento: ${err.message}`, 'error');
    }
}

function appendLog(msg, type = 'info') {
    const el = document.createElement('div');
    el.className = `log-entry ${type}`;
    el.innerText = `> ${msg}`;
    logBox.appendChild(el);
    logBox.scrollTop = logBox.scrollHeight;
}

// Determine media type from MIME or extension
function getMediaType(file) {
    if (file.type.startsWith('video/')) return 'video';
    if (file.type.startsWith('audio/')) return 'audio';
    if (file.type.startsWith('image/')) return 'image';
    
    const ext = file.name.split('.').pop().toLowerCase();
    if (['mp4', 'mkv', 'avi', 'mov', 'webm', 'flv'].includes(ext)) return 'video';
    if (['mp3', 'wav', 'aac', 'ogg', 'flac', 'm4a'].includes(ext)) return 'audio';
    if (['png', 'jpg', 'jpeg', 'webp', 'gif', 'bmp'].includes(ext)) return 'image';
    
    return 'video'; // Default fallback
}

// File Selection Handler
function handleFileSelect(file) {
    if (!file) return;
    selectedFile = file;

    fileName.innerText = file.name;
    fileSize.innerText = (file.size / (1024 * 1024)).toFixed(2) + ' MB';

    const mediaType = getMediaType(file);
    fileIcon.innerText = mediaType === 'video' ? '🎬' : mediaType === 'audio' ? '🎵' : '🖼️';

    // Populate format options
    outputFormatSelect.innerHTML = '';
    const options = FORMAT_OPTIONS[mediaType] || FORMAT_OPTIONS.video;
    options.forEach(opt => {
        const el = document.createElement('option');
        el.value = opt.value;
        el.innerText = opt.label;
        outputFormatSelect.appendChild(el);
    });

    if (mediaType === 'video') {
        presetGroup.classList.remove('hidden');
    } else {
        presetGroup.classList.add('hidden');
    }

    dropZone.classList.add('hidden');
    fileInfo.classList.remove('hidden');
    optionsSection.classList.remove('hidden');
    resultSection.classList.add('hidden');

    if (ffmpeg && ffmpeg.isLoaded()) {
        convertBtn.disabled = false;
    }
}

// Event Listeners for File Input & Drag and Drop
fileInput.addEventListener('change', (e) => {
    if (e.target.files.length > 0) {
        handleFileSelect(e.target.files[0]);
    }
});

dropZone.addEventListener('dragover', (e) => {
    e.preventDefault();
    dropZone.classList.add('dragover');
});

dropZone.addEventListener('dragleave', () => {
    dropZone.classList.remove('dragover');
});

dropZone.addEventListener('drop', (e) => {
    e.preventDefault();
    dropZone.classList.remove('dragover');
    if (e.dataTransfer.files.length > 0) {
        handleFileSelect(e.dataTransfer.files[0]);
    }
});

removeFileBtn.addEventListener('click', () => {
    resetApp();
});

resetBtn.addEventListener('click', () => {
    resetApp();
});

function resetApp() {
    selectedFile = null;
    fileInput.value = '';
    dropZone.classList.remove('hidden');
    fileInfo.classList.add('hidden');
    optionsSection.classList.add('hidden');
    progressSection.classList.add('hidden');
    resultSection.classList.add('hidden');
    progressBar.style.width = '0%';
    progressPercent.innerText = '0%';
    logBox.innerHTML = '<div class="log-entry system">> Pronto para novo processamento.</div>';
}

// Conversion Logic
convertBtn.addEventListener('click', async () => {
    if (!selectedFile || !ffmpeg || !ffmpeg.isLoaded()) return;

    convertBtn.disabled = true;
    optionsSection.classList.add('hidden');
    progressSection.classList.remove('hidden');
    progressStatus.innerText = 'Carregando arquivo na memória virtual...';

    const inputExt = selectedFile.name.split('.').pop();
    const inputFileName = `input_${Date.now()}.${inputExt}`;
    const outputFormat = outputFormatSelect.value;
    const outputFileName = `converted_${Date.now()}.${outputFormat}`;

    try {
        // Write file to FFmpeg Virtual FS
        ffmpeg.FS('writeFile', inputFileName, await fetchFile(selectedFile));

        progressStatus.innerText = 'Executando conversão via WebAssembly...';

        // Prepare FFmpeg args
        let args = ['-i', inputFileName];

        const preset = document.getElementById('qualityPreset').value;
        const mediaType = getMediaType(selectedFile);

        if (mediaType === 'video' && ['mp4', 'mkv', 'webm'].includes(outputFormat)) {
            args.push('-preset', preset);
        }

        args.push(outputFileName);

        // Run conversion
        await ffmpeg.run(...args);

        // Read output
        const data = ffmpeg.FS('readFile', outputFileName);

        // Clean up memory in Virtual FS
        ffmpeg.FS('unlink', inputFileName);
        ffmpeg.FS('unlink', outputFileName);

        // Create Blob & Download link
        const mimeType = `${getMediaType({ type: outputFormat })}/${outputFormat}`;
        const blob = new Blob([data.buffer], { type: mimeType });
        const url = URL.createObjectURL(blob);

        downloadBtn.href = url;
        downloadBtn.download = `convertido_${selectedFile.name.split('.')[0]}.${outputFormat}`;

        progressSection.classList.add('hidden');
        resultSection.classList.remove('hidden');
    } catch (err) {
        console.error("Erro na conversão:", err);
        progressStatus.innerText = 'Erro durante a conversão!';
        appendLog(`ERRO: ${err.message}`, 'error');
        convertBtn.disabled = false;
        optionsSection.classList.remove('hidden');
    }
});

// Start initialization on page load
initFFmpeg();
