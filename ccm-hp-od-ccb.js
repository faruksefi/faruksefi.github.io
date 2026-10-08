// ccm-hp-od-ccb.js
// TEST 13 — Dynamic Load Protocol and Calculation Tables; visual corrections
// HTML basis: TEST 11 layout v4

document.addEventListener("DOMContentLoaded", function () {

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

    // Seven cycle-dependent output columns, in the HTML table order.
    const calculationColumns = [
        "calculation-sigma-v-mun-lin",
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
    }

    nInput.addEventListener("input", updateCycleInputs);
    nInput.addEventListener("change", updateCycleInputs);
    updateCycleInputs();

    // ==================================================
    // CALCULATE
    // ==================================================

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

            for (let k = 0; k < cycleNumber; k++) {

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
        // INITIAL VALUES — TEST 5
        // ==================================================

        let j = 1;
        let i = 0;
        let sigmaV = 0;
        let epsilonV = 0;
        let sigmaVHis = 0;
        let B10 = 0;

        console.log("Initial values =", {
            j, i, sigmaV, epsilonV, sigmaVHis, B10
        });

        // ==================================================
        // FIRST LOADING STEP — TEST 6
        // ==================================================

        sigmaV += deltaSigmaV;

        console.log("Loading stress step =", {
            j, i, sigmaV
        });

        // ==================================================
        // HISTORICAL STRESS — TEST 7
        // ==================================================

        sigmaVHis = Math.max(sigmaVHis, sigmaV);

        console.log("Historical stress =", {
            j, i, sigmaV, sigmaVHis
        });

        // ==================================================
        // CONSOLE OUTPUT — TEST 10
        // ==================================================

        console.log("TEST 11 — C10 =", C10);
        console.log("TEST 11 — Mi =", Mi);
        console.log("TEST 11 — Mf =", Mf);
        console.log("TEST 11 — sigmaVMunLin =", sigmaVMunLin);
        console.log("TEST 11 — mtan1 =", mtan1);

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