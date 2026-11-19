#include <iostream>
#include <vector>
#include <cmath>

// GHOSTCODE C++ Demonstration: Geometry & Coordinate Transformations
struct Point3D {
    double x, y, z;
};

double calculateDistance(const Point3D& p1, const Point3D& p2) {
    double dx = p1.x - p2.x;
    double dy = p1.y - p2.y;
    double dz = p1.z - p2.z;
    return std::sqrt(dx * dx + dy * dy + dz * dz);
}

double computeAspectScale(double width, double height) {
    // Potential division by zero if height is zero
    if (height == 0.0) {
        return 0.0;
    }
    return width / height;
}

int main() {
    Point3D a{0.0, 0.0, 0.0};
    Point3D b{10.0, 20.0, 30.0};
    std::cout << "=== GHOSTCODE C++ DEMO ===" << std::endl;
    std::cout << "Distance: " << calculateDistance(a, b) << std::endl;
    std::cout << "Aspect:   " << computeAspectScale(1920.0, 1080.0) << std::endl;
    std::cout << "=== DEMO COMPLETED ===" << std::endl;
    return 0;
}
