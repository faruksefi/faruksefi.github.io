// ccm-hp-od-ccb.js
// TEST 1 — Fig. 23 Load input block
// HTML basis: v31

document.addEventListener("DOMContentLoaded", function () {

    const nInput = document.getElementById("cycles");
    const sigmaVLocInputs =
        document.querySelectorAll(".loading-load");
    const sigmaVUnInputs =
        document.querySelectorAll(".unloading-load");
    const calculateBtn =
        document.getElementById("calculateBtn");


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
                sigmaVLocInputs[j].classList.remove("input-error");
                sigmaVUnInputs[j].classList.remove("input-error");
            }

            const locHint =
                sigmaVLocInputs[j].parentElement
                    .querySelector(".cell-hint");

            const unHint =
                sigmaVUnInputs[j].parentElement
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
    nInput.addEventListener("input", updateCycleInputs);
    nInput.addEventListener("change", updateCycleInputs);

    // Sayfa ilk açıldığında da varsayılan N'yi uygula.
    updateCycleInputs();


    // ==================================================
    // CALCULATE
    // ŞİMDİLİK YALNIZCA LOAD INPUT TESTİ
    // ==================================================

    calculateBtn.addEventListener("click", function () {

        const N = Number(nInput.value);

        const deltaSigmaV =
            Number(
                document.getElementById("increment").value
            );

        const sigmaVLoc = [];
        const sigmaVUn = [];

        let hasInputError = false;


        // ==================================================
        // ÖNCE ESKİ HATA İŞARETLERİNİ TEMİZLE
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

            if (sigmaVLocInputs[j].value !== "") {
                filledSigmaVLoc++;
            }
        }


        // --------------------------------------------------
        // DURUM 1
        // Yalnızca ilk kutu dolu:
        // aynı σv,loc değeri bütün çevrimlere atanır.
        // --------------------------------------------------

        if (
            sigmaVLocInputs[0].value !== "" &&
            filledSigmaVLoc === 1
        ) {

            const firstSigmaVLoc =
                Number(sigmaVLocInputs[0].value);

            for (let j = 0; j < N; j++) {

                sigmaVLoc.push(firstSigmaVLoc);
            }


        // --------------------------------------------------
        // DURUM 2
        // İlk N kutunun tamamı dolu:
        // her çevrim için girilen değer ayrı ayrı kullanılır.
        // --------------------------------------------------

        } else if (filledSigmaVLoc === N) {

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
                        .classList.add("input-error");
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

            if (sigmaVUnInputs[j].value !== "") {
                filledSigmaVUn++;
            }
        }


        // --------------------------------------------------
        // DURUM 1
        // Yalnızca ilk kutu dolu:
        // aynı σv,un değeri bütün çevrimlere atanır.
        // --------------------------------------------------

        if (
            sigmaVUnInputs[0].value !== "" &&
            filledSigmaVUn === 1
        ) {

            const firstSigmaVUn =
                Number(sigmaVUnInputs[0].value);

            for (let j = 0; j < N; j++) {

                sigmaVUn.push(firstSigmaVUn);
            }


        // --------------------------------------------------
        // DURUM 2
        // İlk N kutunun tamamı dolu:
        // her çevrim için girilen değer ayrı ayrı kullanılır.
        // --------------------------------------------------

        } else if (filledSigmaVUn === N) {

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
                        .classList.add("input-error");
                }
            }
        }


        // ==================================================
        // INPUT → CALCULATIONS SINIRI
        // ==================================================

        if (hasInputError) {

            console.log(
                "Load input error: calculation stopped."
            );

            return;
        }


        // ==================================================
        // GEÇİCİ TEST ÇIKTILARI
        // ==================================================

        console.log("N =", N);
        console.log("deltaSigmaV =", deltaSigmaV);
        console.log("sigmaVLoc =", sigmaVLoc);
        console.log("sigmaVUn =", sigmaVUn);

    });

});