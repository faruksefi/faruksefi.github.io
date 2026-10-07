// ccm-hp-od-ccb.js
// TEST 10 — Calculation parameters
// HTML basis: v32

document.addEventListener("DOMContentLoaded", function () {

    const nInput = document.getElementById("cycles");

    const sigmaVLocInputs =
        document.querySelectorAll(".loading-load");

    const sigmaVUnInputs =
        document.querySelectorAll(".unloading-load");

    const calculateBtn =
        document.getElementById("calculateBtn");

    const resetBtn =
        document.getElementById("resetBtn");

    const sigmaVMunLinOutputs =
        document.querySelectorAll(".calculation-sigma-v-mun-lin");

    const mtan1Outputs =
        document.querySelectorAll(".calculation-mtan1");

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
    // ACTIVE / INACTIVE CYCLES — TEST 1
    // ==================================================

    function updateCycleInputs() {

        const N = Number(nInput.value);

        for (let j = 0; j < 12; j++) {

            const isActive = j < N;

            sigmaVLocInputs[j].disabled = !isActive;
            sigmaVUnInputs[j].disabled = !isActive;

            if (!isActive) {
                sigmaVLocInputs[j].classList.remove("input-error");
                sigmaVUnInputs[j].classList.remove("input-error");
            }

            const locHint = sigmaVLocInputs[j]
                .parentElement.querySelector(".cell-hint");

            const unHint = sigmaVUnInputs[j]
                .parentElement.querySelector(".cell-hint");

            if (locHint) {
                locHint.classList.toggle("active-cycle", isActive);
            }

            if (unHint) {
                unHint.classList.toggle("active-cycle", isActive);
            }
        }
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

        const N = Number(nInput.value);

        const deltaSigmaV = Number(
            document.getElementById("increment").value
        );

        const sigmaVLoc = [];
        const sigmaVUn = [];

        let hasInputError = false;

        for (let j = 0; j < N; j++) {
            sigmaVLocInputs[j].classList.remove("input-error");
            sigmaVUnInputs[j].classList.remove("input-error");
        }

        // ==================================================
        // LOCAL MAXIMUM OEDOMETRIC STRESSES
        // ==================================================

        let filledSigmaVLoc = 0;

        for (let j = 0; j < N; j++) {
            if (sigmaVLocInputs[j].value !== "") {
                filledSigmaVLoc++;
            }
        }

        if (
            sigmaVLocInputs[0].value !== "" &&
            filledSigmaVLoc === 1
        ) {

            const firstSigmaVLoc =
                Number(sigmaVLocInputs[0].value);

            for (let j = 0; j < N; j++) {
                sigmaVLoc.push(firstSigmaVLoc);
            }

        } else if (filledSigmaVLoc === N) {

            for (let j = 0; j < N; j++) {
                sigmaVLoc.push(
                    Number(sigmaVLocInputs[j].value)
                );
            }

        } else {

            hasInputError = true;

            for (let j = 0; j < N; j++) {
                if (sigmaVLocInputs[j].value === "") {
                    sigmaVLocInputs[j]
                        .classList.add("input-error");
                }
            }
        }

        // ==================================================
        // TARGET UNLOADING OEDOMETRIC STRESSES
        // ==================================================

        let filledSigmaVUn = 0;

        for (let j = 0; j < N; j++) {
            if (sigmaVUnInputs[j].value !== "") {
                filledSigmaVUn++;
            }
        }

        if (
            sigmaVUnInputs[0].value !== "" &&
            filledSigmaVUn === 1
        ) {

            const firstSigmaVUn =
                Number(sigmaVUnInputs[0].value);

            for (let j = 0; j < N; j++) {
                sigmaVUn.push(firstSigmaVUn);
            }

        } else if (filledSigmaVUn === N) {

            for (let j = 0; j < N; j++) {
                sigmaVUn.push(
                    Number(sigmaVUnInputs[j].value)
                );
            }

        } else {

            hasInputError = true;

            for (let j = 0; j < N; j++) {
                if (sigmaVUnInputs[j].value === "") {
                    sigmaVUnInputs[j]
                        .classList.add("input-error");
                }
            }
        }

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

        for (let index = 0; index < sigmaVMunLinOutputs.length; index++) {

            sigmaVMunLinOutputs[index].value =
                index < N && Number.isFinite(sigmaVMunLin[index])
                    ? sigmaVMunLin[index].toFixed(1)
                    : "";
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

        for (let index = 0; index < mtan1Outputs.length; index++) {

            mtan1Outputs[index].value =
                index < N && Number.isFinite(mtan1[index])
                    ? mtan1[index].toFixed(3)
                    : "";
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

        console.log("TEST 10 — C10 =", C10);
        console.log("TEST 10 — Mi =", Mi);
        console.log("TEST 10 — Mf =", Mf);
        console.log("TEST 10 — sigmaVMunLin =", sigmaVMunLin);
        console.log("TEST 10 — mtan1 =", mtan1);

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