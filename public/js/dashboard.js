(() => {
  if (typeof Chart === 'undefined' || !window.dashboardData) return;

  const { semester = [], subjects = [], grade = {} } = window.dashboardData;

  const withDefault = (arr, labelKey = 'label', valueKey = 'value') => {
    if (!Array.isArray(arr) || arr.length === 0) {
      return { labels: ['Không có dữ liệu'], values: [0] };
    }
    return {
      labels: arr.map((item) => item[labelKey]),
      values: arr.map((item) => Number(item[valueKey]) || 0)
    };
  };

  const semesterEl = document.getElementById('semesterChart');
  if (semesterEl) {
    const mapped = withDefault(semester);
    new Chart(semesterEl, {
      type: 'line',
      data: {
        labels: mapped.labels,
        datasets: [{
          label: 'Điểm trung bình',
          data: mapped.values,
          borderColor: '#2563eb',
          backgroundColor: 'rgba(37, 99, 235, 0.15)',
          fill: true,
          tension: 0.4,
          borderWidth: 3,
          pointRadius: 4
        }]
      },
      options: {
        responsive: true,
        plugins: {
          legend: { display: false },
          tooltip: {
            callbacks: {
              label: (ctx) => `${ctx.parsed.y || 0} điểm`
            }
          }
        },
        scales: {
          y: {
            beginAtZero: true,
            suggestedMax: 10
          }
        }
      }
    });
  }

  const gradeEl = document.getElementById('gradeChart');
  if (gradeEl) {
    const labels = ['Giỏi', 'Khá', 'Trung bình', 'Yếu'];
    const values = [
      grade.gioi || 0,
      grade.kha || 0,
      grade.trungbinh || 0,
      grade.yeu || 0
    ];
    new Chart(gradeEl, {
      type: 'doughnut',
      data: {
        labels,
        datasets: [{
          data: values,
          backgroundColor: ['#16a34a', '#22c55e', '#fbbf24', '#f97316']
        }]
      },
      options: {
        cutout: '65%',
        plugins: {
          legend: {
            position: 'bottom'
          }
        }
      }
    });
  }

  const subjectEl = document.getElementById('subjectChart');
  let subjectChart = null;
  if (subjectEl) {
    const mapped = withDefault(subjects);
    subjectChart = new Chart(subjectEl, {
      type: 'bar',
      data: {
        labels: mapped.labels,
        datasets: [{
          label: 'Điểm trung bình',
          data: mapped.values,
          backgroundColor: '#0ea5e9',
          borderRadius: 8
        }]
      },
      options: {
        indexAxis: 'y',
        responsive: true,
        plugins: {
          legend: { display: false }
        },
        scales: {
          x: {
            beginAtZero: true,
            suggestedMax: 10
          }
        }
      }
    });
  }

  const refreshBtn = document.querySelector('[data-refresh-subjects]');
  if (refreshBtn && subjectChart) {
    refreshBtn.addEventListener('click', () => subjectChart.update());
  }
})();
