"""
Test suite for SIPARHANUD Export and Document features
- Export personel list to Excel
- Export personel list to PDF
- Export statistik to Excel
- Document upload/download/delete for personel
"""
import pytest
import requests
import os
import io

BASE_URL = os.environ.get('REACT_APP_BACKEND_URL', '').rstrip('/')

class TestAuth:
    """Authentication tests"""
    
    @pytest.fixture(scope="class")
    def admin_token(self):
        """Get admin token"""
        response = requests.post(f"{BASE_URL}/api/auth/login", json={
            "username": "admin",
            "password": "admin123"
        })
        assert response.status_code == 200, f"Admin login failed: {response.text}"
        return response.json()["access_token"]
    
    @pytest.fixture(scope="class")
    def staff_token(self):
        """Get staff token"""
        response = requests.post(f"{BASE_URL}/api/auth/login", json={
            "username": "staff1",
            "password": "staff123"
        })
        assert response.status_code == 200, f"Staff login failed: {response.text}"
        return response.json()["access_token"]
    
    def test_admin_login(self, admin_token):
        """Test admin can login"""
        assert admin_token is not None
        assert len(admin_token) > 0
    
    def test_staff_login(self, staff_token):
        """Test staff can login"""
        assert staff_token is not None
        assert len(staff_token) > 0


class TestExportPersonelExcel:
    """Test export personel list to Excel"""
    
    @pytest.fixture(scope="class")
    def admin_token(self):
        response = requests.post(f"{BASE_URL}/api/auth/login", json={
            "username": "admin",
            "password": "admin123"
        })
        return response.json()["access_token"]
    
    def test_export_personel_excel_success(self, admin_token):
        """Test export personel to Excel without filters"""
        headers = {"Authorization": f"Bearer {admin_token}"}
        response = requests.get(f"{BASE_URL}/api/export/personel/excel", headers=headers)
        
        assert response.status_code == 200, f"Export failed: {response.text}"
        assert response.headers.get("content-type") == "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
        assert "attachment" in response.headers.get("content-disposition", "")
        assert len(response.content) > 0
        print(f"Excel file size: {len(response.content)} bytes")
    
    def test_export_personel_excel_with_kategori_filter(self, admin_token):
        """Test export personel to Excel with kategori filter"""
        headers = {"Authorization": f"Bearer {admin_token}"}
        response = requests.get(f"{BASE_URL}/api/export/personel/excel?kategori=PERWIRA", headers=headers)
        
        assert response.status_code == 200, f"Export with filter failed: {response.text}"
        assert response.headers.get("content-type") == "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
        print(f"Filtered Excel file size: {len(response.content)} bytes")
    
    def test_export_personel_excel_with_status_filter(self, admin_token):
        """Test export personel to Excel with status filter"""
        headers = {"Authorization": f"Bearer {admin_token}"}
        response = requests.get(f"{BASE_URL}/api/export/personel/excel?status=AKTIF", headers=headers)
        
        assert response.status_code == 200, f"Export with status filter failed: {response.text}"
        assert response.headers.get("content-type") == "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
    
    def test_export_personel_excel_with_both_filters(self, admin_token):
        """Test export personel to Excel with both filters"""
        headers = {"Authorization": f"Bearer {admin_token}"}
        response = requests.get(f"{BASE_URL}/api/export/personel/excel?kategori=BINTARA&status=AKTIF", headers=headers)
        
        assert response.status_code == 200, f"Export with both filters failed: {response.text}"
    
    def test_export_personel_excel_unauthorized(self):
        """Test export without auth returns 401/403"""
        response = requests.get(f"{BASE_URL}/api/export/personel/excel")
        assert response.status_code in [401, 403], f"Expected 401/403, got {response.status_code}"


class TestExportPersonelPDF:
    """Test export personel list to PDF"""
    
    @pytest.fixture(scope="class")
    def admin_token(self):
        response = requests.post(f"{BASE_URL}/api/auth/login", json={
            "username": "admin",
            "password": "admin123"
        })
        return response.json()["access_token"]
    
    def test_export_personel_pdf_success(self, admin_token):
        """Test export personel to PDF without filters"""
        headers = {"Authorization": f"Bearer {admin_token}"}
        response = requests.get(f"{BASE_URL}/api/export/personel/pdf", headers=headers)
        
        assert response.status_code == 200, f"PDF Export failed: {response.text}"
        assert response.headers.get("content-type") == "application/pdf"
        assert "attachment" in response.headers.get("content-disposition", "")
        assert len(response.content) > 0
        # PDF files start with %PDF
        assert response.content[:4] == b'%PDF', "Response is not a valid PDF"
        print(f"PDF file size: {len(response.content)} bytes")
    
    def test_export_personel_pdf_with_kategori_filter(self, admin_token):
        """Test export personel to PDF with kategori filter"""
        headers = {"Authorization": f"Bearer {admin_token}"}
        response = requests.get(f"{BASE_URL}/api/export/personel/pdf?kategori=PERWIRA", headers=headers)
        
        assert response.status_code == 200, f"PDF Export with filter failed: {response.text}"
        assert response.headers.get("content-type") == "application/pdf"
    
    def test_export_personel_pdf_with_status_filter(self, admin_token):
        """Test export personel to PDF with status filter"""
        headers = {"Authorization": f"Bearer {admin_token}"}
        response = requests.get(f"{BASE_URL}/api/export/personel/pdf?status=AKTIF", headers=headers)
        
        assert response.status_code == 200, f"PDF Export with status filter failed: {response.text}"
    
    def test_export_personel_pdf_unauthorized(self):
        """Test PDF export without auth returns 401/403"""
        response = requests.get(f"{BASE_URL}/api/export/personel/pdf")
        assert response.status_code in [401, 403], f"Expected 401/403, got {response.status_code}"


class TestExportStatistikExcel:
    """Test export statistik to Excel"""
    
    @pytest.fixture(scope="class")
    def admin_token(self):
        response = requests.post(f"{BASE_URL}/api/auth/login", json={
            "username": "admin",
            "password": "admin123"
        })
        return response.json()["access_token"]
    
    def test_export_statistik_excel_success(self, admin_token):
        """Test export statistik to Excel"""
        headers = {"Authorization": f"Bearer {admin_token}"}
        response = requests.get(f"{BASE_URL}/api/export/statistik/excel", headers=headers)
        
        assert response.status_code == 200, f"Statistik Export failed: {response.text}"
        assert response.headers.get("content-type") == "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
        assert "attachment" in response.headers.get("content-disposition", "")
        assert len(response.content) > 0
        print(f"Statistik Excel file size: {len(response.content)} bytes")
    
    def test_export_statistik_excel_unauthorized(self):
        """Test statistik export without auth returns 401/403"""
        response = requests.get(f"{BASE_URL}/api/export/statistik/excel")
        assert response.status_code in [401, 403], f"Expected 401/403, got {response.status_code}"


class TestDocumentEndpoints:
    """Test document upload/download/delete endpoints"""
    
    TEST_NRP = "11120017460989"  # Test personel NRP
    
    @pytest.fixture(scope="class")
    def admin_token(self):
        response = requests.post(f"{BASE_URL}/api/auth/login", json={
            "username": "admin",
            "password": "admin123"
        })
        return response.json()["access_token"]
    
    @pytest.fixture(scope="class")
    def staff_token(self):
        response = requests.post(f"{BASE_URL}/api/auth/login", json={
            "username": "staff1",
            "password": "staff123"
        })
        return response.json()["access_token"]
    
    def test_get_documents_empty(self, admin_token):
        """Test get documents for personel (may be empty)"""
        headers = {"Authorization": f"Bearer {admin_token}"}
        response = requests.get(f"{BASE_URL}/api/personel/{self.TEST_NRP}/documents", headers=headers)
        
        assert response.status_code == 200, f"Get documents failed: {response.text}"
        data = response.json()
        assert isinstance(data, list), "Response should be a list"
        print(f"Found {len(data)} existing documents")
    
    def test_upload_document_success(self, admin_token):
        """Test upload document for personel"""
        headers = {"Authorization": f"Bearer {admin_token}"}
        
        # Create a test PDF file content
        test_content = b"%PDF-1.4\n1 0 obj\n<<\n/Type /Catalog\n>>\nendobj\ntrailer\n<<\n/Root 1 0 R\n>>\n%%EOF"
        files = {"file": ("test_document.pdf", io.BytesIO(test_content), "application/pdf")}
        params = {"jenis_dokumen": "SK_PANGKAT", "keterangan": "Test document upload"}
        
        response = requests.post(
            f"{BASE_URL}/api/personel/{self.TEST_NRP}/documents",
            headers=headers,
            files=files,
            params=params
        )
        
        assert response.status_code == 200, f"Upload failed: {response.text}"
        data = response.json()
        assert "id" in data, "Response should contain document id"
        assert data.get("message") == "Dokumen berhasil diupload"
        print(f"Uploaded document ID: {data['id']}")
        return data["id"]
    
    def test_upload_document_invalid_extension(self, admin_token):
        """Test upload document with invalid extension"""
        headers = {"Authorization": f"Bearer {admin_token}"}
        
        test_content = b"This is a test file"
        files = {"file": ("test.exe", io.BytesIO(test_content), "application/octet-stream")}
        params = {"jenis_dokumen": "LAINNYA", "keterangan": "Invalid file"}
        
        response = requests.post(
            f"{BASE_URL}/api/personel/{self.TEST_NRP}/documents",
            headers=headers,
            files=files,
            params=params
        )
        
        assert response.status_code == 400, f"Expected 400 for invalid extension, got {response.status_code}"
    
    def test_upload_document_missing_jenis(self, admin_token):
        """Test upload document without jenis_dokumen"""
        headers = {"Authorization": f"Bearer {admin_token}"}
        
        test_content = b"%PDF-1.4\ntest"
        files = {"file": ("test.pdf", io.BytesIO(test_content), "application/pdf")}
        
        response = requests.post(
            f"{BASE_URL}/api/personel/{self.TEST_NRP}/documents",
            headers=headers,
            files=files
        )
        
        # Should fail because jenis_dokumen is required
        assert response.status_code == 422, f"Expected 422 for missing jenis_dokumen, got {response.status_code}"
    
    def test_get_documents_after_upload(self, admin_token):
        """Test get documents after upload"""
        headers = {"Authorization": f"Bearer {admin_token}"}
        
        # First upload a document
        test_content = b"%PDF-1.4\n1 0 obj\n<<\n/Type /Catalog\n>>\nendobj\ntrailer\n<<\n/Root 1 0 R\n>>\n%%EOF"
        files = {"file": ("test_get_doc.pdf", io.BytesIO(test_content), "application/pdf")}
        params = {"jenis_dokumen": "IJAZAH", "keterangan": "Test for get"}
        
        upload_response = requests.post(
            f"{BASE_URL}/api/personel/{self.TEST_NRP}/documents",
            headers=headers,
            files=files,
            params=params
        )
        assert upload_response.status_code == 200
        doc_id = upload_response.json()["id"]
        
        # Now get documents
        response = requests.get(f"{BASE_URL}/api/personel/{self.TEST_NRP}/documents", headers=headers)
        assert response.status_code == 200
        
        data = response.json()
        assert isinstance(data, list)
        assert len(data) > 0, "Should have at least one document"
        
        # Find our uploaded document
        found = False
        for doc in data:
            if doc.get("id") == doc_id:
                found = True
                assert doc.get("jenis_dokumen") == "IJAZAH"
                assert doc.get("keterangan") == "Test for get"
                assert "nama_file" in doc
                assert "file_size" in doc
                assert "uploaded_by_name" in doc
                break
        
        assert found, f"Uploaded document {doc_id} not found in list"
        print(f"Document verified in list: {doc_id}")
        return doc_id
    
    def test_download_document(self, admin_token):
        """Test download document"""
        headers = {"Authorization": f"Bearer {admin_token}"}
        
        # First upload a document
        test_content = b"%PDF-1.4\nDownload test content"
        files = {"file": ("download_test.pdf", io.BytesIO(test_content), "application/pdf")}
        params = {"jenis_dokumen": "SERTIFIKAT", "keterangan": "Download test"}
        
        upload_response = requests.post(
            f"{BASE_URL}/api/personel/{self.TEST_NRP}/documents",
            headers=headers,
            files=files,
            params=params
        )
        assert upload_response.status_code == 200
        doc_id = upload_response.json()["id"]
        
        # Download the document
        response = requests.get(f"{BASE_URL}/api/documents/{doc_id}/download", headers=headers)
        
        assert response.status_code == 200, f"Download failed: {response.text}"
        assert len(response.content) > 0
        print(f"Downloaded document size: {len(response.content)} bytes")
        return doc_id
    
    def test_download_nonexistent_document(self, admin_token):
        """Test download non-existent document"""
        headers = {"Authorization": f"Bearer {admin_token}"}
        response = requests.get(f"{BASE_URL}/api/documents/nonexistent-id/download", headers=headers)
        
        assert response.status_code == 404, f"Expected 404, got {response.status_code}"
    
    def test_delete_document(self, admin_token):
        """Test delete document"""
        headers = {"Authorization": f"Bearer {admin_token}"}
        
        # First upload a document
        test_content = b"%PDF-1.4\nDelete test content"
        files = {"file": ("delete_test.pdf", io.BytesIO(test_content), "application/pdf")}
        params = {"jenis_dokumen": "LAINNYA", "keterangan": "Delete test"}
        
        upload_response = requests.post(
            f"{BASE_URL}/api/personel/{self.TEST_NRP}/documents",
            headers=headers,
            files=files,
            params=params
        )
        assert upload_response.status_code == 200
        doc_id = upload_response.json()["id"]
        
        # Delete the document
        response = requests.delete(f"{BASE_URL}/api/documents/{doc_id}", headers=headers)
        
        assert response.status_code == 200, f"Delete failed: {response.text}"
        assert response.json().get("message") == "Dokumen berhasil dihapus"
        
        # Verify document is deleted
        get_response = requests.get(f"{BASE_URL}/api/documents/{doc_id}/download", headers=headers)
        assert get_response.status_code == 404, "Document should be deleted"
        print(f"Document {doc_id} successfully deleted")
    
    def test_delete_nonexistent_document(self, admin_token):
        """Test delete non-existent document"""
        headers = {"Authorization": f"Bearer {admin_token}"}
        response = requests.delete(f"{BASE_URL}/api/documents/nonexistent-id", headers=headers)
        
        assert response.status_code == 404, f"Expected 404, got {response.status_code}"
    
    def test_upload_document_invalid_nrp(self, admin_token):
        """Test upload document for non-existent personel"""
        headers = {"Authorization": f"Bearer {admin_token}"}
        
        test_content = b"%PDF-1.4\ntest"
        files = {"file": ("test.pdf", io.BytesIO(test_content), "application/pdf")}
        params = {"jenis_dokumen": "SK_PANGKAT", "keterangan": "Test"}
        
        response = requests.post(
            f"{BASE_URL}/api/personel/INVALID_NRP_12345/documents",
            headers=headers,
            files=files,
            params=params
        )
        
        assert response.status_code == 404, f"Expected 404 for invalid NRP, got {response.status_code}"


class TestRoleBasedAccess:
    """Test role-based access for export and document endpoints"""
    
    TEST_NRP = "11120017460989"
    
    @pytest.fixture(scope="class")
    def leader_token(self):
        response = requests.post(f"{BASE_URL}/api/auth/login", json={
            "username": "pimpinan",
            "password": "pimpin123"
        })
        if response.status_code == 200:
            return response.json()["access_token"]
        return None
    
    @pytest.fixture(scope="class")
    def verifier_token(self):
        response = requests.post(f"{BASE_URL}/api/auth/login", json={
            "username": "verifikator1",
            "password": "verif123"
        })
        if response.status_code == 200:
            return response.json()["access_token"]
        return None
    
    @pytest.fixture(scope="class")
    def personnel_token(self):
        response = requests.post(f"{BASE_URL}/api/auth/login", json={
            "username": "personel1",
            "password": "personel123"
        })
        if response.status_code == 200:
            return response.json()["access_token"]
        return None
    
    def test_leader_can_export_excel(self, leader_token):
        """Test leader role can export Excel"""
        if not leader_token:
            pytest.skip("Leader token not available")
        
        headers = {"Authorization": f"Bearer {leader_token}"}
        response = requests.get(f"{BASE_URL}/api/export/personel/excel", headers=headers)
        
        assert response.status_code == 200, f"Leader should be able to export Excel: {response.text}"
    
    def test_leader_can_export_pdf(self, leader_token):
        """Test leader role can export PDF"""
        if not leader_token:
            pytest.skip("Leader token not available")
        
        headers = {"Authorization": f"Bearer {leader_token}"}
        response = requests.get(f"{BASE_URL}/api/export/personel/pdf", headers=headers)
        
        assert response.status_code == 200, f"Leader should be able to export PDF: {response.text}"
    
    def test_verifier_cannot_export(self, verifier_token):
        """Test verifier role cannot export"""
        if not verifier_token:
            pytest.skip("Verifier token not available")
        
        headers = {"Authorization": f"Bearer {verifier_token}"}
        response = requests.get(f"{BASE_URL}/api/export/personel/excel", headers=headers)
        
        # Verifier should not have export access
        assert response.status_code == 403, f"Verifier should not be able to export: {response.status_code}"
    
    def test_personnel_cannot_upload_documents(self, personnel_token):
        """Test personnel role cannot upload documents"""
        if not personnel_token:
            pytest.skip("Personnel token not available")
        
        headers = {"Authorization": f"Bearer {personnel_token}"}
        
        test_content = b"%PDF-1.4\ntest"
        files = {"file": ("test.pdf", io.BytesIO(test_content), "application/pdf")}
        params = {"jenis_dokumen": "SK_PANGKAT", "keterangan": "Test"}
        
        response = requests.post(
            f"{BASE_URL}/api/personel/{self.TEST_NRP}/documents",
            headers=headers,
            files=files,
            params=params
        )
        
        # Personnel should not be able to upload
        assert response.status_code == 403, f"Personnel should not be able to upload: {response.status_code}"
    
    def test_personnel_can_view_own_documents(self, personnel_token):
        """Test personnel can view their own documents"""
        if not personnel_token:
            pytest.skip("Personnel token not available")
        
        headers = {"Authorization": f"Bearer {personnel_token}"}
        response = requests.get(f"{BASE_URL}/api/personel/{self.TEST_NRP}/documents", headers=headers)
        
        # Personnel should be able to view their own documents
        assert response.status_code == 200, f"Personnel should be able to view own documents: {response.text}"


if __name__ == "__main__":
    pytest.main([__file__, "-v", "--tb=short"])
