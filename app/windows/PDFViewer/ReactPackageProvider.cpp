#include "pch.h"
#include "ReactPackageProvider.h"
#include "NativeModules.h"
#include "PDFViewerNativeModules.h"

using namespace winrt::Microsoft::ReactNative;

namespace winrt::PDFViewer::implementation
{

void ReactPackageProvider::CreatePackage(IReactPackageBuilder const &packageBuilder) noexcept
{
    AddAttributedModules(packageBuilder, true);
}

} // namespace winrt::PDFViewer::implementation
