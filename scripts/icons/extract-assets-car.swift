// Extracts named images from the original app's Assets.car using macOS CoreUI (private API, dev-only).
// Build: swiftc -O scripts/icons/extract-assets-car.swift -o /tmp/carextract
// Run:   /tmp/carextract <Assets.car> <outDir> 3 icon_canyin icon_yifu ...   (writes <name>@3x.png)
// The original bundle is private and lives off-repo (~/Desktop/RICH-reference/).

import Foundation
import CoreGraphics
import ImageIO
import UniformTypeIdentifiers

// Usage: carextract <Assets.car> <outDir> <scale> <name>...
let args = CommandLine.arguments
guard args.count >= 5 else { print("usage"); exit(2) }
let carURL = URL(fileURLWithPath: args[1]); let outDir = URL(fileURLWithPath: args[2]); let scale = Double(args[3])!
guard dlopen("/System/Library/PrivateFrameworks/CoreUI.framework/CoreUI", RTLD_NOW) != nil,
      let catalogClass = NSClassFromString("CUICatalog") as? NSObject.Type else { print("CoreUI unavailable"); exit(1) }
let alloc = catalogClass.perform(NSSelectorFromString("alloc")).takeUnretainedValue() as! NSObject
typealias InitFn = @convention(c) (AnyObject, Selector, NSURL, UnsafeMutablePointer<NSError?>?) -> AnyObject?
let initSel = NSSelectorFromString("initWithURL:error:")
let initImp = unsafeBitCast(alloc.method(for: initSel), to: InitFn.self)
guard let catalog = initImp(alloc, initSel, carURL as NSURL, nil) as? NSObject else { print("cannot open catalog"); exit(1) }
typealias ImgFn = @convention(c) (AnyObject, Selector, NSString, Double) -> AnyObject?
let imgSel = NSSelectorFromString("imageWithName:scaleFactor:")
let imgImp = unsafeBitCast(catalog.method(for: imgSel), to: ImgFn.self)
for name in args[4...] {
  guard let named = imgImp(catalog, imgSel, name as NSString, scale) as? NSObject else { print("missing", name); continue }
  typealias CGFn = @convention(c) (AnyObject, Selector) -> Unmanaged<CGImage>?
  let cgSel = NSSelectorFromString("image")
  guard named.responds(to: cgSel) else { print("no image selector on", type(of: named)); continue }
  let cgImp = unsafeBitCast(named.method(for: cgSel), to: CGFn.self)
  guard let image = cgImp(named, cgSel)?.takeUnretainedValue() else { print("no CGImage", name); continue }
  let dest = outDir.appendingPathComponent("\(name)@\(Int(scale))x.png")
  let writer = CGImageDestinationCreateWithURL(dest as CFURL, UTType.png.identifier as CFString, 1, nil)!
  CGImageDestinationAddImage(writer, image, nil); CGImageDestinationFinalize(writer)
  print("wrote", dest.lastPathComponent, image.width, "x", image.height)
}
