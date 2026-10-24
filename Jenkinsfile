// Pipeline CI LaundryTrack Asrama - Proyek 1 PABWE 2026
// Berjalan di Jenkins Linux (sh) maupun Windows (bat).
def run(String cmd) { if (isUnix()) { sh cmd } else { bat cmd } }

pipeline {
  agent any

  options {
    timestamps()
    disableConcurrentBuilds()
  }

  stages {
    stage('Checkout') {
      steps { checkout scm }
    }

    stage('Install back-end') {
      steps { dir('backend') { script { run('npm ci') } } }
    }

    stage('Uji back-end') {
      steps { dir('backend') { script { run('npm run test:ci') } } }
      post {
        always { junit allowEmptyResults: true, testResults: 'backend/test-results.xml' }
      }
    }

    stage('Build front-end') {
      steps {
        dir('frontend') {
          script {
            run('npm ci')
            run('npm run build')
          }
        }
      }
    }

    stage('Arsipkan hasil build') {
      steps { archiveArtifacts artifacts: 'frontend/dist/**', fingerprint: true }
    }
  }

  post {
    success { echo 'Build, pengujian, dan packaging berhasil. Siap di-deploy.' }
    failure { echo 'Pipeline gagal. Periksa log tahap yang berwarna merah.' }
  }
}
