#pragma once

#include "JSValue.h"
#include "NativeModules.h"

#include <winrt/Windows.ApplicationModel.h>
#include <winrt/Windows.Security.Cryptography.h>
#include <winrt/Windows.Storage.h>
#include <winrt/Windows.Storage.Pickers.h>
#include <winrt/Windows.Storage.Provider.h>

#include <algorithm>
#include <unordered_map>

namespace winrt::PDFViewer
{

REACT_MODULE(BundleResources)
struct BundleResources
{
    REACT_CONSTANT_PROVIDER(GetConstants)
    void GetConstants(Microsoft::ReactNative::ReactConstantProvider &constants) noexcept
    {
        // react-native-webview 14's Windows manager mistakenly passes
        // ms-appx-web URIs to NavigateToString, leaving WebView2 at
        // about:blank. A file URI navigates normally and preserves relative
        // access to pdf.js, its worker, fonts, cmaps, and the sample PDF.
        std::wstring path{Windows::ApplicationModel::Package::Current().InstalledLocation().Path()};
        std::replace(path.begin(), path.end(), L'\\', L'/');
        auto viewerURL = L"file:///" + path + L"/Assets/pdfjs/viewer.html";
        constants.Add(L"viewerURL", hstring{viewerURL});
    }
};

REACT_MODULE(FilePicker)
struct FilePicker
{
    REACT_INIT(Initialize)
    void Initialize(Microsoft::ReactNative::ReactContext const &context) noexcept
    {
        m_context = context;
    }

    REACT_METHOD(OpenPDF, L"openPDF")
    void OpenPDF(Microsoft::ReactNative::ReactPromise<Microsoft::ReactNative::JSValue> &&result) noexcept
    {
        m_context.UIDispatcher().Post([this, result = std::move(result)]() mutable {
            OpenPDFAsync(std::move(result));
        });
    }

    REACT_METHOD(SaveBytes, L"saveBytes")
    void SaveBytes(
        std::string token,
        std::string base64,
        Microsoft::ReactNative::ReactPromise<bool> &&result) noexcept
    {
        m_context.UIDispatcher().Post(
            [this, token = std::move(token), base64 = std::move(base64), result = std::move(result)]() mutable {
                SaveBytesAsync(std::move(token), std::move(base64), std::move(result));
            });
    }

    REACT_METHOD(SaveAsPDF, L"saveAsPDF")
    void SaveAsPDF(
        std::string suggestedName,
        std::string base64,
        Microsoft::ReactNative::ReactPromise<Microsoft::ReactNative::JSValue> &&result) noexcept
    {
        m_context.UIDispatcher().Post(
            [this,
             suggestedName = std::move(suggestedName),
             base64 = std::move(base64),
             result = std::move(result)]() mutable {
                SaveAsPDFAsync(std::move(suggestedName), std::move(base64), std::move(result));
            });
    }

private:
    using JSValue = Microsoft::ReactNative::JSValue;
    using JSValueObject = Microsoft::ReactNative::JSValueObject;
    using StorageFile = Windows::Storage::StorageFile;

    std::string RememberFile(StorageFile const &file)
    {
        auto token = "file-" + std::to_string(++m_nextToken);
        m_files.insert_or_assign(token, file);
        return token;
    }

    static Windows::Storage::Streams::IBuffer Decode(std::string const &base64)
    {
        return Windows::Security::Cryptography::CryptographicBuffer::DecodeFromBase64String(to_hstring(base64));
    }

    fire_and_forget OpenPDFAsync(Microsoft::ReactNative::ReactPromise<JSValue> result) noexcept
    {
        try
        {
            Windows::Storage::Pickers::FileOpenPicker picker;
            picker.ViewMode(Windows::Storage::Pickers::PickerViewMode::List);
            picker.SuggestedStartLocation(Windows::Storage::Pickers::PickerLocationId::DocumentsLibrary);
            picker.FileTypeFilter().Append(L".pdf");

            auto file = co_await picker.PickSingleFileAsync();
            if (!file)
            {
                result.Resolve(JSValue{});
                co_return;
            }

            auto bytes = co_await Windows::Storage::FileIO::ReadBufferAsync(file);
            auto base64 = Windows::Security::Cryptography::CryptographicBuffer::EncodeToBase64String(bytes);
            auto token = RememberFile(file);
            result.Resolve(JSValue{JSValueObject{
                {"name", to_string(file.Name())},
                {"path", std::move(token)},
                {"base64", to_string(base64)},
            }});
        }
        catch (hresult_error const &error)
        {
            result.Reject(error.message().c_str());
        }
    }

    fire_and_forget SaveBytesAsync(
        std::string token,
        std::string base64,
        Microsoft::ReactNative::ReactPromise<bool> result) noexcept
    {
        try
        {
            auto file = m_files.find(token);
            if (file == m_files.end())
            {
                result.Resolve(false);
                co_return;
            }

            Windows::Storage::CachedFileManager::DeferUpdates(file->second);
            co_await Windows::Storage::FileIO::WriteBufferAsync(file->second, Decode(base64));
            auto status = co_await Windows::Storage::CachedFileManager::CompleteUpdatesAsync(file->second);
            result.Resolve(status == Windows::Storage::Provider::FileUpdateStatus::Complete);
        }
        catch (hresult_error const &error)
        {
            result.Reject(error.message().c_str());
        }
    }

    fire_and_forget SaveAsPDFAsync(
        std::string suggestedName,
        std::string base64,
        Microsoft::ReactNative::ReactPromise<JSValue> result) noexcept
    {
        try
        {
            Windows::Storage::Pickers::FileSavePicker picker;
            picker.SuggestedStartLocation(Windows::Storage::Pickers::PickerLocationId::DocumentsLibrary);
            picker.SuggestedFileName(to_hstring(suggestedName));
            picker.FileTypeChoices().Insert(
                L"PDF document",
                single_threaded_vector<hstring>({L".pdf"}));

            auto file = co_await picker.PickSaveFileAsync();
            if (!file)
            {
                result.Resolve(JSValue{});
                co_return;
            }

            Windows::Storage::CachedFileManager::DeferUpdates(file);
            co_await Windows::Storage::FileIO::WriteBufferAsync(file, Decode(base64));
            auto status = co_await Windows::Storage::CachedFileManager::CompleteUpdatesAsync(file);
            if (status != Windows::Storage::Provider::FileUpdateStatus::Complete)
            {
                result.Reject(L"Windows could not complete the PDF save operation.");
                co_return;
            }

            auto token = RememberFile(file);
            result.Resolve(JSValue{JSValueObject{
                {"path", std::move(token)},
                {"name", to_string(file.Name())},
            }});
        }
        catch (hresult_error const &error)
        {
            result.Reject(error.message().c_str());
        }
    }

    Microsoft::ReactNative::ReactContext m_context{nullptr};
    std::unordered_map<std::string, StorageFile> m_files;
    uint64_t m_nextToken{0};
};

} // namespace winrt::PDFViewer
