import LaptopLayout from './Laptop';

const layouts = {
    'laptop': LaptopLayout,
    'tablet': LaptopLayout,
    'phone': LaptopLayout
};

export default function getLayout(device: string | null) {
    return layouts[(device ?? 'laptop') as keyof object] as React.ElementType;
}