export function formatScore(score: number, nbDigits: number) {
    const scoreStr = score.toString();
    let zeroToAdd = 0;

    if (scoreStr.length < nbDigits) {
        zeroToAdd = nbDigits - scoreStr.length;
    }

    let zeros = "";
    for (let i = 0; i < zeroToAdd; i++) {
        zeros += "0";
    }

    //  event though JS/TS allows you to do this. concatenation between string and number
    // is illegal in other languages. That's why I added a convert
    return zeros + String(score);
}