// swift-tools-version: 5.9

import AppleProductTypes
import PackageDescription

let package = Package(
    name: "RICHPlayground",
    platforms: [
        .iOS("17.0")
    ],
    products: [
        .iOSApplication(
            name: "RICHPlayground",
            targets: ["RICHPlayground"],
            bundleIdentifier: "com.anwen.RICHPlayground",
            teamIdentifier: "",
            displayVersion: "1.0",
            bundleVersion: "1",
            appIcon: .placeholder(icon: .wallet),
            accentColor: .presetColor(.mint),
            supportedDeviceFamilies: [
                .pad,
                .phone
            ],
            supportedInterfaceOrientations: [
                .portrait,
                .landscapeRight,
                .landscapeLeft,
                .portraitUpsideDown(.when(deviceFamilies: [.pad]))
            ]
        )
    ],
    targets: [
        .executableTarget(
            name: "RICHPlayground"
        )
    ]
)
