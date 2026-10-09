// ccm-hp-od-ccb.js
// TEST 17 — Eq. (21), (23), (32), (33), (36); dynamic tables
// HTML basis: TEST 11 layout v4

document.addEventListener("DOMContentLoaded", function () {

    // TEST 17: ArrowUp/ArrowDown must not increment/decrement numeric inputs.
    // Event delegation also covers dynamically generated loading/unloading cells.
    document.addEventListener("keydown", function (event) {
        if ((event.key === "ArrowUp" || event.key === "ArrowDown") &&
            event.target instanceof HTMLInputElement &&
            event.target.type === "number") {
            event.preventDefault();
        }
    });

    const nInput = document.getElementById("cycles");

    const loadProtocolBody = document.getElementById("loadProtocolBody");
    const sigmaVLocInputs = () => document.querySelectorAll(".loading-load");
    const sigmaVUnInputs = () => document.querySelectorAll(".unloading-load");

    const calculateBtn =
        document.getElementById("calculateBtn");

    const resetBtn =
        document.getElementById("resetBtn");

    const calculationResultsBody =
        document.getElementById("calculationResultsBody");

    // Nine cycle-dependent output columns, in the HTML table order.
    const calculationColumns = [
        "calculation-sigma-v-y",
        "calculation-sigma-v-mun-lin",
        "calculation-sigma-v-mi-f",
        "calculation-mtan1",
        "calculation-mun-lin",
        "calculation-mun-lin2",
        "calculation-mun-sec",
        "calculation-mre-lin1",
        "calculation-mre-lin2"
    ];

    function getCycleCount() {
        const N = Number(nInput.value);
        return Number.isInteger(N) && N >= 1 && N <= 999 ? N : null;
    }

    function buildCalculationTable(N) {
        if (!calculationResultsBody) return;
        calculationResultsBody.replaceChildren();
        if (N === null) return;

        const fragment = document.createDocumentFragment();
        for (let index = 0; index < N; index++) {
            const tr = document.createElement("tr");
            const th = document.createElement("th");
            th.scope = "row";
            th.textContent = String(index + 1);
            tr.appendChild(th);

            for (const className of calculationColumns) {
                const td = document.createElement("td");
                const input = document.createElement("input");
                input.type = "number";
                input.readOnly = true;
                input.className = className;
                input.setAttribute("aria-label", `${className}, cycle ${index + 1}`);
                td.appendChild(input);
                tr.appendChild(td);
            }
            fragment.appendChild(tr);
        }
        calculationResultsBody.appendChild(fragment);
    }

    function updateCalculationRows() {
        buildCalculationTable(getCycleCount());
    }

    nInput.addEventListener("input", updateCalculationRows);
    nInput.addEventListener("change", updateCalculationRows);
    updateCalculationRows();

    // ==================================================
    // GRAIN ORIGIN / MODEL CONSTANTS — TEST 3
    // ==================================================

    const originSelect =
        document.getElementById("origin");

    const modelConstantInputs =
        document.querySelectorAll(".constants-table tbody input");

    function updateModelConstants() {

        const isUserDefined =
            originSelect.value === "user-defined";

        for (const input of modelConstantInputs) {

            if (isUserDefined) {
                input.readOnly = false;
            } else {
                input.value = input.dataset.basalt;
                input.readOnly = true;
                input.classList.remove("input-error");
            }
        }
    }

    originSelect.addEventListener("change", updateModelConstants);
    updateModelConstants();

    // ==================================================
    // RESET — TEST 4
    // ==================================================

    resetBtn.addEventListener("click", function () {
        window.location.reload();
    });

    // ==================================================
    // DYNAMIC LOADING / UNLOADING INPUT TABLE — TEST 12
    // ==================================================
    function updateCycleInputs() {
        const N = getCycleCount();
        const previous = Array.from(loadProtocolBody.querySelectorAll("tr"), tr => ({
            loc: tr.querySelector(".loading-load")?.value ?? "",
            un: tr.querySelector(".unloading-load")?.value ?? ""
        }));
        const fragment = document.createDocumentFragment();
        for (let j = 0; j < (N || 0); j++) {
            const tr = document.createElement("tr");
            const th = document.createElement("th");
            th.scope = "row";
            th.textContent = String(j + 1);
            tr.appendChild(th);
            for (const [className, key, label] of [
                ["loading-load", "loc", "Loading"],
                ["unloading-load", "un", "Unloading"]
            ]) {
                const td = document.createElement("td");
                const input = document.createElement("input");
                input.type = "number";
                input.step = "0.1";
                input.className = className + " fmt-1";
                input.value = previous[j]?.[key] ?? "";
                input.setAttribute("aria-label", `${label}, cycle ${j + 1} (MPa)`);
                input.addEventListener("input", () => input.classList.remove("input-error"));
                input.addEventListener("blur", () => {
                    if (input.value.trim() !== "" && Number.isFinite(Number(input.value))) {
                        input.value = Number(input.value).toFixed(1);
                    }
                });
                td.appendChild(input);
                tr.appendChild(td);
            }
            fragment.appendChild(tr);
        }
        loadProtocolBody.replaceChildren(fragment);
        // TEST 16: stop the input table at the final visible cycle.
        const scroll = loadProtocolBody.closest(".load-protocol-table-scroll");
        if (scroll) scroll.style.height = N === null ? "auto" : `${Math.min(228, 43 + 39 * N)}px`;
    }

    nInput.addEventListener("input", updateCycleInputs);
    nInput.addEventListener("change", updateCycleInputs);
    updateCycleInputs();

    // ==================================================
    // CALCULATE
    // ==================================================


    // ==================================================
    // Eq. (19) — Lade et al. (1996): B10 versus historical stress
    // The same historical maximum is used for loading and unloading.
    // ==================================================
    // Eq. (19) — Persistent historical-stress matrix for loading/unloading.
    // Each record corresponds to one cycle j and one path p (l or u).
    // The two paths share the same historical maximum within a cycle.
    let grainBreakageHistory = [];

    function buildGrainBreakageHistory(C10, sigmaVLoc, sigmaVUn) {
        const records = [];
        let maximum = 0;
        for (let index = 0; index < sigmaVLoc.length; index++) {
            maximum = Math.max(maximum, sigmaVLoc[index]);
            const breakage = 1 - Math.exp(-C10 * maximum); // Eq. (19)
            for (const path of ["l", "u"]) {
                records.push({ i: 0, j: index + 1, p: path,
                    sigmaVHis: maximum, B10: breakage,
                    sigmaV: path === "l" ? sigmaVLoc[index] : sigmaVUn[index] });
            }
        }
        return records;
    }

    function drawBreakageChart(records, C10) {
        const canvas=document.getElementById('breakageChart');
        if(!canvas||!records.length||!Number.isFinite(C10))return;
        const ctx=canvas.getContext('2d');if(!ctx)return;
        const maxX=Math.max(1,...records.map(r=>r.sigmaVHis));
        const maxB=Math.max(0,...records.map(r=>r.B10));
        const yAxis=niceAxis(Math.max(0.00001,maxB*1.04));
        // The B10 axis must never exceed its theoretical upper limit of 1.
        yAxis.max=Math.min(1,yAxis.max);
        if(yAxis.max/yAxis.step>12)yAxis.step=niceAxis(yAxis.max,5).step;
        const {X,Y}=drawAxes(ctx,canvas,maxX*1.05,maxB,historyMath,breakageMath,1,2,yAxis);
        // Discrete computed points only: no theoretical continuous curve.
        ctx.fillStyle='#b44930';
        const shown=new Set();
        for(const record of records){
            const key=record.sigmaVHis.toFixed(10);
            if(shown.has(key))continue;shown.add(key);
            ctx.beginPath();ctx.arc(X(record.sigmaVHis),Y(record.B10),2.8,0,2*Math.PI);ctx.fill();
        }
    }

    // TEST 25 — User Lab Data (manual visual calibration only).
    const labDataBody = document.getElementById('labDataBody');
    function addLabRow(values = ['', '']) {
        if (!labDataBody) return;
        const tr = document.createElement('tr');
        const th = document.createElement('th');
        th.scope = 'row'; th.textContent = String(labDataBody.rows.length + 1);
        tr.appendChild(th);
        for (let col = 0; col < 2; col++) {
            const td = document.createElement('td');
            const input = document.createElement('input');
            input.type = 'text'; input.inputMode = 'decimal'; input.autocomplete = 'off'; input.spellcheck = false;
            input.className = 'lab-value'; input.value = values[col] ?? '';
            input.setAttribute('aria-label', (col === 0 ? 'Vertical strain' : 'Oedometric stress') + ', row ' + th.textContent);
            input.addEventListener('input', () => {
                input.classList.remove('input-error');
                if (tr === labDataBody.lastElementChild &&
                    Array.from(tr.querySelectorAll('input')).some(el => el.value.trim() !== '')) addLabRow();
                refreshLabOverlay();
            });
            input.addEventListener('paste', event => {
                const pasted = event.clipboardData?.getData('text/plain');
                if (pasted == null) return;
                // Plain single-value paste remains native; TSV/multiline is handled as a grid.
                if (!/[\t\r\n|]/.test(pasted)) return;
                event.preventDefault();
                const lines = pasted.replace(/\r\n?/g, '\n').replace(/\n+$/, '').split('\n');
                const startRow = Array.from(labDataBody.rows).indexOf(tr);
                const startCol = col;
                let offset = 0;
                for (const line of lines) {
                    const trimmed = line.trim();
                    if (!trimmed) continue;
                    let cells;
                    if (line.includes('\t')) cells = line.split('\t');
                    else if (trimmed.includes('|')) cells = trimmed.replace(/^\|/, '').replace(/\|$/, '').split('|');
                    else if (trimmed.includes(';')) cells = line.split(';');
                    else cells = [line];
                    cells = cells.map(cell => cell.trim());
                    // Ignore Markdown table headings and separator rows.
                    if (cells.every(cell => /^:?-{2,}:?$/.test(cell)) ||
                        cells.some(cell => /^(?:ε|σ|strain|stress)/i.test(cell))) continue;
                    while (labDataBody.rows.length <= startRow + offset) addLabRow();
                    const dest = labDataBody.rows[startRow + offset].querySelectorAll('input');
                    cells.slice(0, 2 - startCol).forEach((cell, k) => {
                        dest[startCol + k].value = cell;
                        dest[startCol + k].classList.remove('input-error');
                    });
                    offset++;
                }
                if (Array.from(labDataBody.lastElementChild.querySelectorAll('input')).some(el => el.value.trim())) addLabRow();
                refreshLabOverlay();
            });
            td.appendChild(input); tr.appendChild(td);
        }
        labDataBody.appendChild(tr);
    }
    addLabRow();
    const showLabDataCheckbox = document.getElementById('showLabData');
    showLabDataCheckbox?.addEventListener('change', refreshLabOverlay);
    function parseLabNumber(value) {
        const normalized = value.trim().replace(/\s/g, '').replace(',', '.');
        if (!/^[+-]?(?:\d+(?:\.\d*)?|\.\d+)(?:[eE][+-]?\d+)?$/.test(normalized)) return NaN;
        return Number(normalized);
    }
    function getLabRecords() {
        if (!labDataBody) return [];
        const result = [];
        for (const tr of labDataBody.rows) {
            const cells = tr.querySelectorAll('input');
            const a = cells[0].value.trim(), b = cells[1].value.trim();
            if (a === '' && b === '') continue;
            const strain = parseLabNumber(a), stress = parseLabNumber(b);
            cells[0].classList.toggle('input-error', a !== '' && !Number.isFinite(strain));
            cells[1].classList.toggle('input-error', b !== '' && !Number.isFinite(stress));
            if (a === '' || b === '' || !Number.isFinite(strain) || !Number.isFinite(stress)) continue;
            result.push({epsilonV:strain,sigmaV:stress});
        }
        return result;
    }
    function refreshLabOverlay() {
        if (calculationDataset?.stressStrainRecords?.length) drawCompressionChart(calculationDataset.stressStrainRecords);
    }

    // TEST 20: Shared numerical results. Calculation and Output use this object.
    let calculationDataset = null;

    function niceAxis(maximum, count = 5) {
        const raw = Math.max(maximum, 1e-12) / count;
        const magnitude = Math.pow(10, Math.floor(Math.log10(raw)));
        const factor = [1, 2, 2.5, 5, 10].find(n => n * magnitude >= raw) || 10;
        const step = factor * magnitude;
        return { step, max: Math.ceil(maximum / step) * step };
    }
    // Draw mathematical labels with actual lowered subscripts. Upright punctuation and units.
    function mathLabel(ctx, pieces, cx, cy, rotation = 0) {
        ctx.save(); ctx.translate(cx, cy); ctx.rotate(rotation);
        const fonts = { normal: 'italic 17px Georgia, "Times New Roman", serif',
            sub: 'italic 12px Georgia, "Times New Roman", serif',
            upright: '17px Georgia, "Times New Roman", serif',
            subUpright: '12px Georgia, "Times New Roman", serif' };
        const widths = pieces.map(p => { ctx.font = fonts[p[1]]; return ctx.measureText(p[0]).width; });
        let x = -widths.reduce((a,b) => a+b, 0)/2;
        ctx.fillStyle = '#1f2c35'; ctx.textAlign = 'left'; ctx.textBaseline = 'alphabetic';
        pieces.forEach((p,k) => { ctx.font=fonts[p[1]]; ctx.fillText(p[0],x, p[1].startsWith('sub') ? 5 : 0); x+=widths[k]; });
        ctx.restore();
    }
    const stressMath = [['σ','normal'],['v','sub'],['(','upright'],['i','normal'],[',','upright'],['j','normal'],[',','upright'],['p','normal'],[')','upright'],[' (MPa)','upright']];
    const strainMath = [['ε','normal'],['v','sub'],['(','upright'],['i','normal'],[',','upright'],['j','normal'],[',','upright'],['p','normal'],[')','upright'],[' (-)','upright']];
    const historyMath = [['σ','normal'],['v,his','sub'],['(','upright'],['i','normal'],[',','upright'],['j','normal'],[',','upright'],['p','normal'],[')','upright'],[' (MPa)','upright']];
    const breakageMath = [['B','normal'],['10','subUpright'],['(','upright'],['i','normal'],[',','upright'],['j','normal'],[',','upright'],['p','normal'],[')','upright']];

    function drawAxes(ctx, canvas, maxX, maxY, xPieces, yPieces, xDigits, yDigits, yAxisOverride=null) {
        const W=canvas.width,H=canvas.height;
        const left=90,right=28,top=26,bottom=78;
        const plotW=W-left-right,plotH=H-top-bottom;
        const xa=niceAxis(Math.max(maxX,1e-8));
        const ya=yAxisOverride || niceAxis(Math.max(maxY,1e-8));
        const X=x=>left+x/xa.max*plotW;
        const Y=y=>top+plotH-y/ya.max*plotH;
        ctx.clearRect(0,0,W,H); ctx.fillStyle='#fff';ctx.fillRect(0,0,W,H);
        ctx.font='15px Georgia, "Times New Roman", serif';
        ctx.lineWidth=1;ctx.strokeStyle='#e4e9ed';ctx.fillStyle='#29333b';
        ctx.textBaseline='middle';ctx.textAlign='right';
        for(let n=0;n<=Math.round(ya.max/ya.step);n++){
            const val=n*ya.step,y=Y(val);
            ctx.beginPath();ctx.moveTo(left,y);ctx.lineTo(W-right,y);ctx.stroke();
            ctx.fillText(val.toFixed(yDigits),left-10,y);
        }
        ctx.textBaseline='top';ctx.textAlign='center';
        for(let n=0;n<=Math.round(xa.max/xa.step);n++){
            const val=n*xa.step;
            ctx.fillText(val.toFixed(xDigits),X(val),H-bottom+10);
        }
        ctx.strokeStyle='#111';ctx.lineWidth=1.4;
        ctx.strokeRect(left,top,plotW,plotH);
        mathLabel(ctx,xPieces,left+plotW/2,H-13);
        mathLabel(ctx,yPieces,25,top+plotH/2,-Math.PI/2);
        return {X,Y};
    }

    function drawCompressionChart(records) {
        const canvas=document.getElementById('compressionChart');
        if(!canvas || !records.length)return;
        const ctx=canvas.getContext('2d');if(!ctx)return;
        const labRecords=showLabDataCheckbox?.checked ? getLabRecords() : [];
        const maxX=Math.max(...records.map(r=>r.epsilonV),...labRecords.map(r=>r.epsilonV));
        const maxY=Math.max(...records.map(r=>r.sigmaVHis),...labRecords.map(r=>r.sigmaV));
        const decimals=maxX<0.1?3:2;
        const {X,Y}=drawAxes(ctx,canvas,maxX*1.05,maxY*1.02,strainMath,stressMath,decimals,1);
        const colors={l:'#176c9b',u:'#b44930',r:'#397b51'};
        for(let k=1;k<records.length;k++){
            const a=records[k-1],b=records[k];
            ctx.strokeStyle=colors[b.p]||'#176c9b';ctx.lineWidth=2.2;
            ctx.beginPath();ctx.moveTo(X(a.epsilonV),Y(a.sigmaV));ctx.lineTo(X(b.epsilonV),Y(b.sigmaV));ctx.stroke();
        }
        // Overlay laboratory measurements in the original order; no fitting or sorting.
        if (labRecords.length) {
            if (labRecords.length > 1) {
                ctx.save();
                ctx.strokeStyle='rgba(0,0,0,0.55)';
                ctx.lineWidth=1.2;
                ctx.beginPath();
                labRecords.forEach((r,k) => k ? ctx.lineTo(X(r.epsilonV),Y(r.sigmaV)) : ctx.moveTo(X(r.epsilonV),Y(r.sigmaV)));
                ctx.stroke();
                ctx.restore();
            }
        }
        // Legend in upper left, drawn inside plot and kept compact.
        const entries=[['l','Loading'],['u','Unloading'],['r','Reloading']];
        if(labRecords.length)entries.push(['lab','User Lab Data']);
        const lx=104,ly=39,lw=labRecords.length?185:151,lh=entries.length*23+10;
        ctx.fillStyle='rgba(255,255,255,0.95)';ctx.fillRect(lx,ly,lw,lh);
        ctx.strokeStyle='#222';ctx.lineWidth=1;ctx.strokeRect(lx,ly,lw,lh);
        ctx.font='15px Georgia, "Times New Roman", serif';ctx.textAlign='left';ctx.textBaseline='middle';
        entries.forEach(([p,label],k)=>{
            const y=ly+17+k*23;
            ctx.strokeStyle=p==='lab'?'rgba(0,0,0,0.55)':colors[p];ctx.lineWidth=p==='lab'?1.2:2.3;
            ctx.beginPath();ctx.moveTo(lx+12,y);ctx.lineTo(lx+43,y);ctx.stroke();
            ctx.fillStyle='#202b32';ctx.fillText(label,lx+53,y);
        });
    }

    function buildStressStrainRecords(params) {
        const {N,deltaSigmaV,sigmaVLoc,sigmaVUn,Mi,Mf,mtan1,mtan2,C10,
            sigmaVMunLin,sigmaVMiF,sigmaVY,MunLin,MunLin2,MreLin1,MreLin2}=params;
        if(!(deltaSigmaV>0))throw new Error('Stress increment must be positive.');
        const records=[];let stress=0,strain=0,his=0;
        const push=(j,p)=>records.push({i:records.length,j,p,sigmaV:stress,epsilonV:strain,
            sigmaVHis:his,B10:1-Math.exp(-C10*his)});
        push(1,'l');
        const stepTo=(target,modulus,j,p)=>{
            if(!(Number.isFinite(modulus)&&modulus>0))throw new Error('Invalid '+p+' modulus at cycle '+j);
            const change=target-stress;
            strain+=change/modulus;stress=target;his=Math.max(his,stress);push(j,p);
        };
        const linear=(target,modulus,j,p)=>{
            if(Math.abs(target-stress)<1e-10)return;
            const sign=Math.sign(target-stress);
            let guard=0;
            while(sign*(target-stress)>1e-10){
                if(++guard>100000)throw new Error('Too many stress steps');
                stepTo(stress+sign*Math.min(deltaSigmaV,Math.abs(target-stress)),modulus,j,p);
            }
        };
        const loading=(target,j)=>{
            let guard=0;
            while(target-stress>1e-10){
                if(++guard>100000)throw new Error('Too many loading steps');
                const next=stress+Math.min(deltaSigmaV,target-stress);
                const nextHis=Math.max(his,next);
                const factor=1/(1+Math.exp(-mtan1[j-1]*nextHis));
                const Mtan=Mi+(Mf-Mi)*Math.pow(factor,mtan2);
                stepTo(next,Mtan,j,'l');
            }
        };
        for(let j=1;j<=N;j++){
            if(j===1)loading(sigmaVLoc[0],j);
            else {
                // Fig. 23: reloading to sigma_v,y, then loading to local maximum.
                const transition=sigmaVMiF[j-1];
                const yieldStress=sigmaVY[j-1];
                const reEnd=Math.min(sigmaVLoc[j-1],yieldStress);
                if(reEnd>stress){
                    // Eq. (23): the reloading modulus changes at sigma_v,Mi,f(j).
                    // Start from the current stress–strain state, regardless of the preceding path.
                    const firstEnd=Math.min(reEnd,Math.max(stress,transition));
                    linear(firstEnd,MreLin1[j-1],j,'r');
                    linear(reEnd,MreLin2[j-1],j,'r');
                }
                if(sigmaVLoc[j-1]>stress)loading(sigmaVLoc[j-1],j);
            }
            // Fig. 23: two unloading moduli separated at sigma_v,Mun,lin.
            const unloadTarget=sigmaVUn[j-1];
            if(unloadTarget>stress+1e-10)throw new Error('Unloading target above local maximum, cycle '+j);
            const transition=sigmaVMunLin[j-1];
            linear(Math.max(unloadTarget,transition),MunLin[j-1],j,'u');
            linear(unloadTarget,MunLin2[j-1],j,'u');
        }
        return records;
    }


    // TEST 22: Standalone XLSX export, no external JavaScript libraries required.
    function excelColumn(n){let v='';for(n++;n;n=Math.floor((n-1)/26))v=String.fromCharCode(65+(n-1)%26)+v;return v;}
    function xmlEscape(v){return String(v).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;').replace(/'/g,'&apos;');}
    function sheetXml(rows){
        let xml='<?xml version="1.0" encoding="UTF-8" standalone="yes"?><worksheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main"><sheetData>';
        rows.forEach((row,ri)=>{
            xml+='<row r="'+(ri+1)+'">';row.forEach((v,ci)=>{
                if(v===null||v===undefined||v==='')return;
                const ref=excelColumn(ci)+(ri+1);
                if(typeof v==='number'&&Number.isFinite(v))xml+='<c r="'+ref+'"><v>'+v+'</v></c>';
                else xml+='<c r="'+ref+'" t="inlineStr"><is><t>'+xmlEscape(v)+'</t></is></c>';
            });xml+='</row>';
        });
        return xml+'</sheetData></worksheet>';
    }
    function crc32(bytes){let c=-1;for(const b of bytes){c^=b;for(let k=0;k<8;k++)c=(c>>>1)^((c&1)?0xEDB88320:0);}return(c^(-1))>>>0;}
    function zipStored(files){
        const encoder=new TextEncoder(),parts=[],directory=[];let offset=0;
        const u16=(d,p,n)=>d.setUint16(p,n,true),u32=(d,p,n)=>d.setUint32(p,n>>>0,true);
        for(const [name,contents] of files){
            const filename=encoder.encode(name),data=encoder.encode(contents),crc=crc32(data);
            const local=new Uint8Array(30+filename.length),v=new DataView(local.buffer);
            u32(v,0,0x04034b50);u16(v,4,20);u16(v,6,0);u16(v,8,0);u32(v,14,crc);u32(v,18,data.length);u32(v,22,data.length);u16(v,26,filename.length);local.set(filename,30);
            parts.push(local,data);
            const central=new Uint8Array(46+filename.length),w=new DataView(central.buffer);
            u32(w,0,0x02014b50);u16(w,4,20);u16(w,6,20);u32(w,16,crc);u32(w,20,data.length);u32(w,24,data.length);u16(w,28,filename.length);u32(w,42,offset);central.set(filename,46);
            directory.push(central);offset+=local.length+data.length;
        }
        const dirSize=directory.reduce((n,a)=>n+a.length,0),end=new Uint8Array(22),e=new DataView(end.buffer);
        u32(e,0,0x06054b50);u16(e,8,files.length);u16(e,10,files.length);u32(e,12,dirSize);u32(e,16,offset);
        return new Blob([...parts,...directory,end],{type:'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'});
    }
    function downloadExcelWorkbook(){
        if(!calculationDataset || !calculationDataset.stressStrainRecords?.length){alert('Please calculate first.');return;}
        const d=calculationDataset;
        const rows=[['i','j','p','sigma_v (MPa)','epsilon_v (-)','sigma_v,his (MPa)','B10 (-)']];
        for(const r of d.stressStrainRecords)rows.push([r.i,r.j,r.p,r.sigmaV,r.epsilonV,r.sigmaVHis,r.B10]);
        const summary=[['Parameter','Value','Cycle j']];
        for(const name of ['N','C10','Mi','Mf'])summary.push([name,d[name],'']);
        const fields=['sigmaVLoc','sigmaVUn','mtan1','sigmaVMunLin','sigmaVMiF','sigmaVY','MunLin','MunLin2','MunSec','MreLin1','MreLin2'];
        for(const field of fields){
            const values=d[field];if(!Array.isArray(values))continue;
            values.forEach((v,k)=>summary.push([field,v,k+1]));
        }
        const files=[
            ['[Content_Types].xml','<?xml version="1.0" encoding="UTF-8"?><Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types"><Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/><Default Extension="xml" ContentType="application/xml"/><Override PartName="/xl/workbook.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet.main+xml"/><Override PartName="/xl/worksheets/sheet1.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.worksheet+xml"/><Override PartName="/xl/worksheets/sheet2.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.worksheet+xml"/></Types>'],
            ['_rels/.rels','<?xml version="1.0" encoding="UTF-8"?><Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="xl/workbook.xml"/></Relationships>'],
            ['xl/workbook.xml','<?xml version="1.0" encoding="UTF-8"?><workbook xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships"><sheets><sheet name="Model Data" sheetId="1" r:id="rId1"/><sheet name="Calculation" sheetId="2" r:id="rId2"/></sheets></workbook>'],
            ['xl/_rels/workbook.xml.rels','<?xml version="1.0" encoding="UTF-8"?><Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/worksheet" Target="worksheets/sheet1.xml"/><Relationship Id="rId2" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/worksheet" Target="worksheets/sheet2.xml"/></Relationships>'],
            ['xl/worksheets/sheet1.xml',sheetXml(rows)],
            ['xl/worksheets/sheet2.xml',sheetXml(summary)]
        ];
        const blob=zipStored(files),url=URL.createObjectURL(blob),a=document.createElement('a');
        a.href=url;a.download='CCM-HP-OD-CCB.xlsx';document.body.appendChild(a);a.click();a.remove();
        setTimeout(()=>URL.revokeObjectURL(url),30000);
    }
    document.getElementById('downloadExcel')?.addEventListener('click',downloadExcelWorkbook);

    calculateBtn.addEventListener("click", function () {

        // ==================================================
        // INPUT — LOAD
        // ==================================================

        const N = getCycleCount();
        nInput.classList.toggle("input-error", N === null);
        if (N === null) return;

        const deltaSigmaV = Number(
            document.getElementById("increment").value
        );

        const sigmaVLoc = [];
        const sigmaVUn = [];

        let hasInputError = false;

        // TEST 12: one first-row value means equal amplitude for all N cycles;
        // otherwise every cycle must have an individual value.
        const loadingInputs = sigmaVLocInputs();
        const unloadingInputs = sigmaVUnInputs();
        for (const input of [...loadingInputs, ...unloadingInputs]) {
            input.classList.remove("input-error");
        }

        function readCycleStresses(inputs, output) {
            const activeInputs = Array.from(inputs);
            const filled = activeInputs.filter(input => input.value !== "");

            if (filled.length === 1 && activeInputs[0].value !== "") {
                const value = Number(activeInputs[0].value);
                if (!Number.isFinite(value)) {
                    activeInputs[0].classList.add("input-error");
                    hasInputError = true;
                    return;
                }
                for (let j = 0; j < N; j++) output.push(value);
                return;
            }

            if (filled.length === N && activeInputs.every(input => Number.isFinite(Number(input.value)))) {
                for (const input of activeInputs) output.push(Number(input.value));
                return;
            }

            hasInputError = true;
            for (const input of activeInputs) {
                if (input.value === "" || !Number.isFinite(Number(input.value))) {
                    input.classList.add("input-error");
                }
            }
        }

        readCycleStresses(loadingInputs, sigmaVLoc);
        readCycleStresses(unloadingInputs, sigmaVUn);

        // ==================================================
        // SOIL INITIAL PROPERTIES — TEST 2
        // ==================================================

        const d10Input = document.getElementById("d10");
        const d50Input = document.getElementById("d50");
        const CuInput = document.getElementById("cu");
        const DrInput = document.getElementById("dr");
        const vclInput = document.getElementById("vcl");

        const soilInitialInputs = [
            d10Input,
            d50Input,
            CuInput,
            DrInput,
            vclInput
        ];

        for (const input of soilInitialInputs) {

            input.classList.remove("input-error");

            if (input.value === "") {
                input.classList.add("input-error");
                hasInputError = true;
            }
        }

        const d10_0 = Number(d10Input.value);
        const d50_0 = Number(d50Input.value);
        const Cu_0 = Number(CuInput.value);
        const Dr_0 = Number(DrInput.value);
        const sigmaV_VCL_i = Number(vclInput.value);

        // ==================================================
        // GRAIN ORIGIN / MODEL CONSTANTS — TEST 3
        // ==================================================

        const grainOrigin = originSelect.value;
        const modelConstants = [];

        for (const input of modelConstantInputs) {

            input.classList.remove("input-error");

            if (
                input.value === "" ||
                !Number.isFinite(Number(input.value))
            ) {

                input.classList.add("input-error");
                hasInputError = true;

            } else {
                modelConstants.push(Number(input.value));
            }
        }

        // ==================================================
        // INPUT VALIDATION
        // ==================================================

        if (hasInputError) {
            console.log("Input error: calculation stopped.");
            return;
        }

        // ==================================================
        // Eq. (38) — Grain breakage coefficient, C10
        // ==================================================

        const C10ref = modelConstants[19];
        const d10ref = modelConstants[20];
        const m1 = modelConstants[21];
        const m2 = modelConstants[22];

        const C10 =
            (C10ref - (d10ref - d10_0) * m1) *
            Math.pow(Cu_0, -m2);

        const calculationC10 =
            document.getElementById("calculationC10");

        if (calculationC10) {
            calculationC10.value = Number.isFinite(C10)
                ? C10.toFixed(3)
                : "";
        }

        // ==================================================
        // Eq. (34) — Initial compression modulus, Mi
        // ==================================================

        const a = modelConstants[16];

        const Mi = a * (Dr_0 / 100);

        const calculationMi =
            document.getElementById("calculationMi");

        if (calculationMi) {
            calculationMi.value = Number.isFinite(Mi)
                ? Mi.toFixed(1)
                : "";
        }

        // ==================================================
        // Eq. (35) — Final compression modulus, Mf
        // ==================================================

        const Es1 = modelConstants[17];
        const Es2 = modelConstants[18];

        const Mf =
            Es1 * Math.pow(0.806 * d50_0, -Es2);

        const calculationMf =
            document.getElementById("calculationMf");

        if (calculationMf) {
            calculationMf.value = Number.isFinite(Mf)
                ? Mf.toFixed(1)
                : "";
        }

        // ==================================================
        // Eq. (22) — Final stress of linear unloading
        // sigmaVMunLin(j) = CMu * sigmaVLoc(j)
        // ==================================================

        const CMu = modelConstants[0];

        const sigmaVMunLin = sigmaVLoc.map(
            sigmaVLoc_j => CMu * sigmaVLoc_j
        );

        const sigmaVMunLinOutputs =
            calculationResultsBody.querySelectorAll(".calculation-sigma-v-mun-lin");

        for (let index = 0; index < sigmaVMunLinOutputs.length; index++) {

            const output = sigmaVMunLinOutputs[index];

            output.value =
                index < N && Number.isFinite(sigmaVMunLin[index])
                    ? sigmaVMunLin[index].toFixed(1)
                    : "";

            // Hide the j label when a calculated value is present.

        }

        // ==================================================
        // Eq. (27) — Coefficient mtan1(j)
        //
        // j = 1:
        // mtan1(j) = mtan1_0
        //
        // j > 1:
        // mtan1(j) = mtan1_0
        //   + Cmt * SUM[k=1 to j] MAX(0, sigmaVLoc(k)-VCL)
        // ==================================================

        const mtan1_0 = modelConstants[1];
        const Cmt = modelConstants[3];

        const mtan1 = sigmaVLoc.map((_, index) => {

            const cycleNumber = index + 1;

            if (cycleNumber === 1) {
                return mtan1_0;
            }

            let sum = 0;

            for (let k = 0; k <= index; k++) {

                sum += Math.max(
                    0,
                    sigmaVLoc[k] - sigmaV_VCL_i
                );
            }

            return mtan1_0 + Cmt * sum;
        });

        const mtan1Outputs =
            calculationResultsBody.querySelectorAll(".calculation-mtan1");

        for (let index = 0; index < mtan1Outputs.length; index++) {

            const output = mtan1Outputs[index];

            output.value =
                index < N && Number.isFinite(mtan1[index])
                    ? mtan1[index].toFixed(3)
                    : "";

            // Hide the j label when a calculated value is present.

        }

        // ==================================================
        // Eq. (30) — Linear unloading modulus Mun,lin(j)
        // k = 1, ..., j-1: preceding cycles only.
        // ==================================================
        const [mul1, mul2, mul3, mul4, mul5] = modelConstants.slice(4, 9);
        const MunLin = sigmaVLoc.map((sigma, index) => {
            const rootSigma = Math.sqrt(sigma);
            let priorCycles = 0;
            for (let k = 0; k < index; k++) {
                priorCycles += mul3 * Math.pow(sigmaVLoc[k], mul4)
                    * Math.exp(-mul5 * (k + 1));
            }
            return mul1 * rootSigma / (1 + mul2 * rootSigma) + priorCycles;
        });
        const MunLinOutputs = calculationResultsBody.querySelectorAll(".calculation-mun-lin");
        MunLinOutputs.forEach((output, index) => {
            output.value = index < N && Number.isFinite(MunLin[index])
                ? MunLin[index].toFixed(1) : "";
        });

        // ==================================================
        // Eq. (31) — Secant unloading modulus Mun,sec(j)
        // k = 1, ..., j-1: preceding cycles only.
        // ==================================================
        const [mus1, mus2, mus3, mus4, mus5] = modelConstants.slice(9, 14);
        const MunSec = sigmaVLoc.map((sigma, index) => {
            let priorCycles = 0;
            for (let k = 0; k < index; k++) {
                priorCycles += mus3 * Math.pow(sigmaVLoc[k], mus4)
                    * Math.exp(-mus5 * (k + 1));
            }
            return mus1 * Math.exp(mus2 * sigma) + priorCycles;
        });
        const MunSecOutputs = calculationResultsBody.querySelectorAll(".calculation-mun-sec");
        MunSecOutputs.forEach((output, index) => {
            output.value = index < N && Number.isFinite(MunSec[index])
                ? MunSec[index].toFixed(1) : "";
        });

        // ==================================================
        // Eq. (21) — Yield oedometric stress sigma_v,y(j)
        // Historical stress from the preceding cycles' local maxima.
        // The first cycle has no preceding-cycle history.
        // ==================================================
        const sigmaVY = sigmaVLoc.map((_, index) =>
            index === 0 ? null : Math.max(...sigmaVLoc.slice(0, index))
        );
        calculationResultsBody.querySelectorAll(".calculation-sigma-v-y").forEach((output, index) => {
            output.value = sigmaVY[index] !== null && Number.isFinite(sigmaVY[index])
                ? sigmaVY[index].toFixed(1) : "";
        });

        // ==================================================
        // Eq. (23) — sigma_v,Mi,f(j) = sigma_v,Mun,lin(j-1), j > 1
        // First cycle is intentionally blank.
        // ==================================================
        const sigmaVMiF = sigmaVMunLin.map((_, index) =>
            index === 0 ? null : sigmaVMunLin[index - 1]
        );
        calculationResultsBody.querySelectorAll(".calculation-sigma-v-mi-f").forEach((output, index) => {
            output.value = sigmaVMiF[index] !== null && Number.isFinite(sigmaVMiF[index])
                ? sigmaVMiF[index].toFixed(1) : "";
        });

        // ==================================================
        // Eq. (36) — Second linear unloading modulus Mun,lin2(j)
        // ==================================================
        const MunLin2 = sigmaVLoc.map((sigma, index) => {
            const transition = sigmaVMunLin[index];
            const secant = MunSec[index];
            const first = MunLin[index];
            if (secant === 0 || first === 0) return NaN;
            const denominator = sigma / secant - (sigma - transition) / first;
            return denominator === 0 ? NaN : transition / denominator;
        });
        calculationResultsBody.querySelectorAll(".calculation-mun-lin2").forEach((output, index) => {
            output.value = Number.isFinite(MunLin2[index]) ? MunLin2[index].toFixed(1) : "";
        });

        // ==================================================
        // Eq. (32) — First linear reloading modulus Mre,lin1(j), j > 1
        // ==================================================
        const mr1 = modelConstants[14];
        const MreLin1 = MunSec.map((_, index) => index > 0 ? mr1 * MunSec[index - 1] : null);
        calculationResultsBody.querySelectorAll(".calculation-mre-lin1").forEach((output, index) => {
            output.value = index > 0 && Number.isFinite(MunSec[index - 1])
                ? (mr1 * MunSec[index - 1]).toFixed(1) : "";
        });

        // ==================================================
        // Eq. (33) — Second linear reloading modulus Mre,lin2(j), j > 1
        // ==================================================
        const mr2 = modelConstants[15];
        const MreLin2 = MunSec.map((_, index) => index > 0 ? mr2 * MunSec[index - 1] : null);
        calculationResultsBody.querySelectorAll(".calculation-mre-lin2").forEach((output, index) => {
            output.value = index > 0 && Number.isFinite(MunSec[index - 1])
                ? (mr2 * MunSec[index - 1]).toFixed(1) : "";
        });

        // TEST 20: Calculate once, use the same numerical results in Calculation and Output.
        try {
            const stressStrainRecords = buildStressStrainRecords({
                N,deltaSigmaV,sigmaVLoc,sigmaVUn,Mi,Mf,mtan1,
                mtan2:modelConstants[2],C10,sigmaVMunLin,sigmaVMiF,sigmaVY,
                MunLin,MunLin2,MreLin1,MreLin2
            });
            calculationDataset = {N,C10,Mi,Mf,sigmaVLoc,sigmaVUn,mtan1,
                sigmaVMunLin,sigmaVMiF,sigmaVY,MunLin,MunLin2,MunSec,
                MreLin1,MreLin2,stressStrainRecords};
            // B10 uses the exact same historical-stress records as stress–strain.
            grainBreakageHistory = stressStrainRecords;
            drawCompressionChart(calculationDataset.stressStrainRecords);
            drawBreakageChart(calculationDataset.stressStrainRecords,C10);
            console.log('TEST 22 shared calculation dataset:',calculationDataset);
        } catch(error) {
            console.error('TEST 22 stress–strain calculation error:',error);
            alert('Stress–strain calculation: '+error.message);
        }

        console.log("TEST 11 — C10 =", C10);
        console.log("TEST 11 — Mi =", Mi);
        console.log("TEST 11 — Mf =", Mf);
        console.log("TEST 11 — sigmaVMunLin =", sigmaVMunLin);
        console.log("TEST 11 — mtan1 =", mtan1);
        console.log("TEST 14 — MunLin =", MunLin);
        console.log("TEST 14 — MunSec =", MunSec);

        console.log("sigmaVLoc =", sigmaVLoc);
        console.log("sigmaVUn =", sigmaVUn);

        console.log("Soil initial properties =", {
            d10_0,
            d50_0,
            Cu_0,
            Dr_0,
            sigmaV_VCL_i
        });

        console.log("grainOrigin =", grainOrigin);
        console.log("modelConstants =", modelConstants);

    });
});