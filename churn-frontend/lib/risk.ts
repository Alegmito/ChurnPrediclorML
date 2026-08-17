export function getRiskLevel(probability: number) {
    if (probability >= 0.7) {
        return {
            label: "High Risk",
            text: "text-red-600",
            bar: "bg-red-500",
            badge: "bg-red-100 text-red-700",
        };
    }

    if (probability >= 0.4) {
        return {
            label: "Medium Risk",
            text: "text-yellow-600",
            bar: "bg-yellow-500",
            badge: "bg-yellow-100 text-yellow-700",
        };
    }

    return {
        label: "Low Risk",
        text: "text-green-600",
        bar: "bg-green-500",
        badge: "bg-green-100 text-green-700",
    };
}
