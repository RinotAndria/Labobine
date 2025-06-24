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
        stage('Test') {
            steps {
                sh 'sleep 10' # Attendre que l'application démarre
                sh 'curl -f http://localhost:3000 || exit 1' # Vérifier que le serveur répond
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
        }
        failure {
            echo 'Le pipeline a échoué. Vérifiez les logs.'
        }
    }
}