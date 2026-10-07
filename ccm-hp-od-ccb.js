// ccm-hp-od-ccb.js
// TEST 8 — C10 calculation using Eq. (38)
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
        // TEST 8 — CALCULATION: C10
        // Eq. (38)
        // ==================================================

        const C10ref = modelConstants[19];
        const d10ref = modelConstants[20];
        const m1 = modelConstants[21];
        const m2 = modelConstants