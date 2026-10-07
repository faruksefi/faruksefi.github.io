// ccm-hp-od-ccb.js
// TEST 3 — Fig. 23 Input phase
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
    // GRAIN ORIGIN / MODEL CONSTANTS
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
                // Mevcut değerleri koru; kullanıcı düzenleyebilsin.
                input.readOnly = false;
            } else {
                // Basalt seçildiğinde kanonik Basalt değerini geri yükle.
                input.value = input.dataset.basalt;
                input.readOnly = true;
                input.classList.remove("input-error");
            }
        }
    }

    originSelect.addEventListener("change", updateModelConstants);

    // Sayfa ilk açıldığında Grain origin durumunu uygula.
    updateModelConstants();

// ==================================================
// RESET
// ==================================================

resetBtn.addEventListener("click", function () {

    // Load protocol
    nInput.value = 4;
    deltaInput.value = 0.1;

    for (const input of locInputs) {
        input.value = "";
        input.classList.remove("input-error");
    }

    for (const input of unInputs) {
        input.value = "";
        input.classList.remove("input-error");
    }

    updateActiveCycles();

    // Soil initial properties
    d10Input.value = "";
    d50Input.value = "";
    cuInput.value = "";
    drInput.value = "";
    vclInput.value = "";

    d10Input.classList.remove("input-error");
    d50Input.classList.remove("input-error");
    cuInput.classList.remove("input-error");
    drInput.classList.remove("input-error");
    vclInput.classList.remove("input-error");

    // Grain origin and model constants
    originSelect.value = "basalt";
    updateModelConstants();

    for (const input of modelConstantInputs) {
        input.classList.remove("input-error");
    }

    // Calculation
    const calculationInputs =
        document.querySelectorAll(".calculation-frame input");

    for (const input of calculationInputs) {
        input.value = "";
    }
});

    // ==================================================
    // N'YE GÖRE AKTİF / PASİF ÇEVRİMLER
    // ==================================================

    function updateCycleInputs() {

        const N = Number(nInput.value);

        for (let j = 0; j < 12; j++) {

            const isActive = j < N;

            sigmaVLocInputs[j].disabled = !isActive;
            sigmaVUnInputs[j].disabled = !isActive;

            // N azaltılırsa eski değerleri silme.
            // Yalnızca varsa hata işaretini kaldır.
            if (!isActive) {

                sigmaVLocInputs[j]
                    .classList.remove("input-error");

                sigmaVUnInputs[j]
                    .classList.remove("input-error");
            }

            // Her Load kutusunun kendi j göstergesini bul.
            const locHint =
                sigmaVLocInputs[j]
                    .parentElement
                    .querySelector(".cell-hint");

            const unHint =
                sigmaVUnInputs[j]
                    .parentElement
                    .querySelector(".cell-hint");

            if (locHint) {

                locHint.classList.toggle(
                    "active-cycle",
                    isActive
                );
            }

            if (unHint) {

                unHint.classList.toggle(
                    "active-cycle",
                    isActive
                );
            }
        }
    }


    // N değiştiği anda kutuları güncelle.
    nInput.addEventListener(
        "input",
        updateCycleInputs
    );

    nInput.addEventListener(
        "change",
        updateCycleInputs
    );


    // Sayfa ilk açıldığında varsayılan N'yi uygula.
    updateCycleInputs();



    // ==================================================
    // CALCULATE
    // ==================================================

    calculateBtn.addEventListener(
        "click",
        function () {


        // ==================================================
        // INPUT — LOAD
        // ==================================================

        const N =
            Number(nInput.value);

        const deltaSigmaV =
            Number(
                document
                    .getElementById("increment")
                    .value
            );

        const sigmaVLoc = [];
        const sigmaVUn = [];

        let hasInputError = false;



        // ==================================================
        // ÖNCE ESKİ LOAD HATA İŞARETLERİNİ TEMİZLE
        // ==================================================

        for (let j = 0; j < N; j++) {

            sigmaVLocInputs[j]
                .classList.remove("input-error");

            sigmaVUnInputs[j]
                .classList.remove("input-error");
        }



        // ==================================================
        // σv,loc(j)
        //
        // Fig. 23:
        // Is σv,loc(j) constant across all cycles?
        // ==================================================

        let filledSigmaVLoc = 0;


        for (let j = 0; j < N; j++) {

            if (
                sigmaVLocInputs[j].value !== ""
            ) {

                filledSigmaVLoc++;
            }
        }


        // --------------------------------------------------
        // DURUM 1
        // Yalnızca ilk kutu dolu.
        // Aynı σv,loc değeri bütün çevrimlere atanır.
        // --------------------------------------------------

        if (
            sigmaVLocInputs[0].value !== "" &&
            filledSigmaVLoc === 1
        ) {

            const firstSigmaVLoc =
                Number(
                    sigmaVLocInputs[0].value
                );

            for (let j = 0; j < N; j++) {

                sigmaVLoc.push(
                    firstSigmaVLoc
                );
            }


        // --------------------------------------------------
        // DURUM 2
        // İlk N kutunun tamamı dolu.
        // Her çevrim için ayrı değer kullanılır.
        // --------------------------------------------------

        } else if (
            filledSigmaVLoc === N
        ) {

            for (let j = 0; j < N; j++) {

                sigmaVLoc.push(
                    Number(
                        sigmaVLocInputs[j].value
                    )
                );
            }


        // --------------------------------------------------
        // DURUM 3
        // Giriş eksik / geçersiz.
        // --------------------------------------------------

        } else {

            hasInputError = true;

            for (let j = 0; j < N; j++) {

                if (
                    sigmaVLocInputs[j].value === ""
                ) {

                    sigmaVLocInputs[j]
                        .classList.add(
                            "input-error"
                        );
                }
            }
        }



        // ==================================================
        // σv,un(j)
        //
        // Fig. 23:
        // Is σv,un(j) constant across all cycles?
        // ==================================================

        let filledSigmaVUn = 0;


        for (let j = 0; j < N; j++) {

            if (
                sigmaVUnInputs[j].value !== ""
            ) {

                filledSigmaVUn++;
            }
        }


        // --------------------------------------------------
        // DURUM 1
        // Yalnızca ilk kutu dolu.
        // Aynı σv,un değeri bütün çevrimlere atanır.
        // --------------------------------------------------

        if (
            sigmaVUnInputs[0].value !== "" &&
            filledSigmaVUn === 1
        ) {

            const firstSigmaVUn =
                Number(
                    sigmaVUnInputs[0].value
                );

            for (let j = 0; j < N; j++) {

                sigmaVUn.push(
                    firstSigmaVUn
                );
            }


        // --------------------------------------------------
        // DURUM 2
        // İlk N kutunun tamamı dolu.
        // Her çevrim için ayrı değer kullanılır.
        // --------------------------------------------------

        } else if (
            filledSigmaVUn === N
        ) {

            for (let j = 0; j < N; j++) {

                sigmaVUn.push(
                    Number(
                        sigmaVUnInputs[j].value
                    )
                );
            }


        // --------------------------------------------------
        // DURUM 3
        // Giriş eksik / geçersiz.
        // --------------------------------------------------

        } else {

            hasInputError = true;

            for (let j = 0; j < N; j++) {

                if (
                    sigmaVUnInputs[j].value === ""
                ) {

                    sigmaVUnInputs[j]
                        .classList.add(
                            "input-error"
                        );
                }
            }
        }



        // ==================================================
        // INPUT — SOIL INITIAL PROPERTIES
        // ==================================================

        const d10Input =
            document.getElementById("d10");

        const d50Input =
            document.getElementById("d50");

        const CuInput =
            document.getElementById("cu");

        const DrInput =
            document.getElementById("dr");

        const vclInput =
            document.getElementById("vcl");


        const soilInitialInputs = [
            d10Input,
            d50Input,
            CuInput,
            DrInput,
            vclInput
        ];



        // ==================================================
        // SOIL INITIAL PROPERTIES
        // BOŞ INPUT KONTROLÜ
        // ==================================================

        for (
            const input of soilInitialInputs
        ) {

            // Önce önceki hata işaretini temizle.
            input.classList.remove(
                "input-error"
            );

            // Boşsa hata olarak işaretle.
            if (input.value === "") {

                input.classList.add(
                    "input-error"
                );

                hasInputError = true;
            }
        }



        // ==================================================
        // SOIL INITIAL PROPERTIES
        // SAYISAL DEĞERLERİ OKU
        // ==================================================

        const d10_0 =
            Number(d10Input.value);

        const d50_0 =
            Number(d50Input.value);

        const Cu_0 =
            Number(CuInput.value);

        const Dr_0 =
            Number(DrInput.value);

        const sigmaV_VCL_i =
            Number(vclInput.value);



        // ==================================================
        // INPUT — GRAIN ORIGIN / MODEL CONSTANTS
        // ==================================================

        const grainOrigin =
            originSelect.value;

        const modelConstants = [];

        for (const input of modelConstantInputs) {

            // Önce önceki hata işaretini temizle.
            input.classList.remove("input-error");

            // Model sabiti boş veya sayısal olmayan bir değer olamaz.
		if (input.value === "" || !Number.isFinite(Number(input.value))) {
    			input.classList.add("input-error");
   			 hasInputError = true;
		} else {
    			modelConstants.push(Number(input.value));
}
        }


        // ==================================================
        // INPUT → CALCULATIONS SINIRI
        // ==================================================

        if (hasInputError) {

            console.log(
                "Input error: calculation stopped."
            );

            return;
        }



        // ==================================================
        // GEÇİCİ TEST ÇIKTILARI
        // ==================================================

        console.log("N =", N);

        console.log(
            "deltaSigmaV =",
            deltaSigmaV
        );

        console.log(
            "sigmaVLoc =",
            sigmaVLoc
        );

        console.log(
            "sigmaVUn =",
            sigmaVUn
        );


        // Soil Initial Properties

        console.log(
            "d10_0 =",
            d10_0
        );

        console.log(
            "d50_0 =",
            d50_0
        );

        console.log(
            "Cu_0 =",
            Cu_0
        );

        console.log(
            "Dr_0 =",
            Dr_0
        );

        console.log(
            "sigmaV_VCL_i =",
            sigmaV_VCL_i
        );

        // Grain origin / Model constants

        console.log(
            "grainOrigin =",
            grainOrigin
        );

        console.log(
            "modelConstants =",
            modelConstants
        );

    });

});