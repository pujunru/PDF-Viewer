#include "pch.h"
#include "ReactPackageProvider.h"
#include "NativeModules.h"
#include "PDFViewerNativeModules.h"

using namespace winrt::Microsoft::ReactNative;

namespace winrt::PDFViewer::implementation
{

void ReactPackageProvider::CreatePackage(IReactPackageBuilder const &packageBuilder) noexcept
{
    // Register REACT_MODULE types as classic native modules. Passing `true`
    // here (useTurboModules) registers them as TurboModules, which this
    // old-architecture app (fabric:false) cannot see on NativeModules unless
    // the module also exports constants — that is why the method-only
    // FilePicker was invisible to JS while the constants-backed BundleResources
    // worked.
    AddAttributedModules(packageBuilder);
}

} // namespace winrt::PDFViewer::implementation
