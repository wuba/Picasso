
export type Pixels = {
    shape: [number,number]
    data: any
}

export default function (imgPath: string,cb: (err: Error, pixels:Pixels) => void): void;
