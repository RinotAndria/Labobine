pipeline {
    agent any
    environment {
        DOCKER_COMPOSE_FILE = 'docker-compose.yml'
    }
    stages {
        stage('Checkout') {
            steps {
                git branch: 'main', url: 'https://github.com/RinotAndria/Labobine.git'
            }
        }
        stage('Build Docker Images') {
            steps {
                sh 'docker-compose -f ${DOCKER_COMPOSE_FILE} build'
            }
        }
        stage('Start Containers') {
            steps {
                sh 'docker-compose -f ${DOCKER_COMPOSE_FILE} up -d'
                sh 'sleep 10' // Attendre que les conteneurs démarrent
            }
        }
        stage('Test') {
            steps {
                sh 'curl -f http://app:3000 || exit 1' // Utiliser le nom du service 'app'
            }
        }
        stage('Deploy') {
            steps {
                sh 'docker-compose -f ${DOCKER_COMPOSE_FILE} down'
                sh 'docker-compose -f ${DOCKER_COMPOSE_FILE} up -d --build'
            }
        }
    }
    post {
        always {
            sh 'docker-compose -f ${DOCKER_COMPOSE_FILE} logs'
            sh 'docker-compose -f ${DOCKER_COMPOSE_FILE} down'
        }
        failure {
            echo 'Le pipeline a échoué. Vérifiez les logs.'
        }
    }
}