function viewTask(title, details) {
      document.getElementById("popup-title").textContent = title;
      document.getElementById("popup-details").textContent = details;
      document.getElementById("popup").style.display = "block";
    }

    function editTask(title) {
      alert("Edit screen for: " + title);
      // In future: open a form modal instead of alert
    }

    function closePopup() {
      document.getElementById("popup").style.display = "none";
    }

    // Close popup when clicking outside the box
    window.onclick = function(event) {
      const popup = document.getElementById("popup");
      if (event.target === popup) {
        closePopup();
      }
    }