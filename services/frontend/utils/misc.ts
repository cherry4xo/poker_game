export const ease = [0.410, 0.030, 0.000, 0.995];

export function makeid(length: number) {
    let result = '';
    const characters = 'abcdefghijklmnopqrstuvwxyz';
    let counter = 0;

    while (counter < length) {
        result += characters.charAt(Math.floor(Math.random() * characters.length));
        counter++;
    }

    return result;
}

export const randomorg = (min: number, max: number) => Math.floor(Math.random() * (max - min + 1)) + min;

export const positions = [
    { left: '-5%', top: '-10%' },
    { left: '100%', top: '-10%' },
    { left: '100%', top: '100%' },
    { left: '-5%', top: '100%' },
];
