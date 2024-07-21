import LaptopLayout from './Laptop';
import PhoneLayout from './Phone';

const layouts = {
    'laptop': LaptopLayout,
    'tablet': LaptopLayout,
    'phone': PhoneLayout
};

export default function getLayout(device: string | null) {
    return layouts[(device ?? 'laptop') as keyof object] as React.ElementType;
}